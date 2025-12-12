import { supabase } from '../lib/supabase';
import type { DailySession, HourlyWeight, Advisor, AdvisorAvailability, SessionTemplate } from '../types';

export const adminService = {
  async getOrCreateSession(date: string): Promise<DailySession> {
    const { data: existing, error: fetchError } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('date', date)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Error fetching session: ${fetchError.message}`);
    }

    if (existing) return existing;

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('daily_sessions')
      .insert({ date, total_daily_goal: 0 })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error creating session: ${createError.message}`);
    }

    // Try to copy configuration from the most recent previous session
    // Strategy: 
    // 1. Try to find a session with the SAME day of week (e.g. last Monday)
    // 2. If not found, fallback to the most recent session (e.g. yesterday)
    
    const targetDate = new Date(date);
    const targetDayOfWeek = targetDate.getDay(); // 0-6

    // Fetch last 30 sessions to find a match in JS (simpler than complex SQL date math)
    const { data: recentSessions } = await supabase
      .from('daily_sessions')
      .select('id, date, start_hour, end_hour')
      .lt('date', date)
      .order('date', { ascending: false })
      .limit(30);

    let sourceSession = null;

    if (recentSessions && recentSessions.length > 0) {
      // 1. Try same day of week
      sourceSession = recentSessions.find(s => {
        // Adjust for timezone if necessary, but assuming YYYY-MM-DD strings are consistent
        // We use getUTCDay() if the date string is UTC, but here we rely on the string parsing
        // Let's just parse the YYYY-MM-DD parts to be safe
        const [y, m, day] = s.date.split('-').map(Number);
        const sessionDate = new Date(y, m - 1, day);
        return sessionDate.getDay() === targetDayOfWeek;
      });

      // 2. Fallback to most recent
      if (!sourceSession) {
        sourceSession = recentSessions[0];
      }
    }

    if (sourceSession) {
      // 1. Copy start/end hours
      if (sourceSession.start_hour !== null && sourceSession.end_hour !== null) {
        await supabase
          .from('daily_sessions')
          .update({ start_hour: sourceSession.start_hour, end_hour: sourceSession.end_hour })
          .eq('id', newSession.id);
      }

      // 2. Copy hourly weights
      const { data: lastWeights } = await supabase
        .from('hourly_weights')
        .select('hour_start, percentage')
        .eq('session_id', sourceSession.id);

      if (lastWeights && lastWeights.length > 0) {
        const newWeights = lastWeights.map(w => ({
          session_id: newSession.id,
          hour_start: w.hour_start,
          percentage: w.percentage
        }));

        await supabase.from('hourly_weights').insert(newWeights);
      }
    }
    
    return newSession;
  },

  async updateSessionGoal(id: string, goal: number): Promise<void> {
    const { error } = await supabase
      .from('daily_sessions')
      .update({ total_daily_goal: goal })
      .eq('id', id);
      
    if (error) throw new Error(`Error updating goal: ${error.message}`);
  },

  async updateSessionHours(id: string, startHour: number, endHour: number): Promise<void> {
    const { error } = await supabase
      .from('daily_sessions')
      .update({ start_hour: startHour, end_hour: endHour })
      .eq('id', id);
      
    if (error) throw new Error(`Error updating hours: ${error.message}`);
  },

  async getHourlyWeights(sessionId: string): Promise<HourlyWeight[]> {
    const { data, error } = await supabase
      .from('hourly_weights')
      .select('*')
      .eq('session_id', sessionId)
      .order('hour_start');
    
    if (error) throw new Error(`Error fetching weights: ${error.message}`);
    return data || [];
  },

  async upsertHourlyWeights(weights: Partial<HourlyWeight>[]): Promise<void> {
    const { error } = await supabase
      .from('hourly_weights')
      .upsert(weights, { onConflict: 'session_id,hour_start' });
      
    if (error) throw new Error(`Error updating weights: ${error.message}`);
  },

  async getAdvisors(sessionId: string): Promise<Advisor[]> {
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');
      
    if (error) throw new Error(`Error fetching advisors: ${error.message}`);
    return data || [];
  },

  async createAdvisor(sessionId: string, name: string): Promise<Advisor> {
    const { data, error } = await supabase
      .from('advisors')
      .insert({ session_id: sessionId, name })
      .select()
      .single();
      
    if (error) throw new Error(`Error creating advisor: ${error.message}`);
    return data;
  },

  async deleteAdvisor(id: string): Promise<void> {
    const { error } = await supabase.from('advisors').delete().eq('id', id);
    if (error) throw new Error(`Error deleting advisor: ${error.message}`);
  },

  async getAdvisorAvailability(advisorId: string): Promise<AdvisorAvailability[]> {
    const { data, error } = await supabase
      .from('advisor_availability')
      .select('*')
      .eq('advisor_id', advisorId);
      
    if (error) throw new Error(`Error fetching availability: ${error.message}`);
    return data || [];
  },

  async getAllSessionAvailability(sessionId: string): Promise<AdvisorAvailability[]> {
    const { data: advisors } = await supabase.from('advisors').select('id').eq('session_id', sessionId);
    if (!advisors?.length) return [];
    
    const ids = advisors.map(a => a.id);
    const { data, error } = await supabase
      .from('advisor_availability')
      .select('*')
      .in('advisor_id', ids);
      
    if (error) throw new Error(`Error fetching availability: ${error.message}`);
    return data || [];
  },

  async updateAvailability(advisorId: string, hour: number, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('advisor_availability')
      .upsert({ advisor_id: advisorId, hour_start: hour, is_active: isActive }, { onConflict: 'advisor_id,hour_start' });
      
    if (error) throw new Error(`Error updating availability: ${error.message}`);
  },

  // Template Management
  async getTemplates(): Promise<SessionTemplate[]> {
    const { data, error } = await supabase
      .from('session_templates')
      .select('*')
      .order('name');
      
    if (error) throw new Error(`Error fetching templates: ${error.message}`);
    return data || [];
  },

  async createTemplate(name: string, startHour: number, endHour: number, weights: { hour_start: number, percentage: number }[]): Promise<void> {
    const { error } = await supabase
      .from('session_templates')
      .insert({
        name,
        start_hour: startHour,
        end_hour: endHour,
        weights: weights // Stored as JSONB
      });
      
    if (error) throw new Error(`Error creating template: ${error.message}`);
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from('session_templates').delete().eq('id', id);
    if (error) throw new Error(`Error deleting template: ${error.message}`);
  },

  async applyTemplate(sessionId: string, templateId: string): Promise<void> {
    // 1. Get Template
    const { data: template, error: tError } = await supabase
      .from('session_templates')
      .select('*')
      .eq('id', templateId)
      .single();
      
    if (tError || !template) throw new Error(`Error fetching template: ${tError?.message}`);

    // 2. Update Session Hours
    await this.updateSessionHours(sessionId, template.start_hour, template.end_hour);

    // 3. Clear existing weights
    await supabase.from('hourly_weights').delete().eq('session_id', sessionId);

    // 4. Insert new weights
    // Cast the JSONB weights back to the expected array format
    const weights = (template.weights as unknown as { hour_start: number, percentage: number }[]).map(w => ({
      session_id: sessionId,
      hour_start: w.hour_start,
      percentage: w.percentage
    }));

    if (weights.length > 0) {
      await this.upsertHourlyWeights(weights);
    }
  }
};
