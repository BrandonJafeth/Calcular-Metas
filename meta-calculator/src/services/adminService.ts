import { supabase } from '../lib/supabase';
import type { DailySession, HourlyWeight, Advisor, AdvisorAvailability } from '../types';

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
    const { data: lastSession } = await supabase
      .from('daily_sessions')
      .select('id, start_hour, end_hour')
      .lt('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (lastSession) {
      // 1. Copy start/end hours
      if (lastSession.start_hour !== null && lastSession.end_hour !== null) {
        await supabase
          .from('daily_sessions')
          .update({ start_hour: lastSession.start_hour, end_hour: lastSession.end_hour })
          .eq('id', newSession.id);
      }

      // 2. Copy hourly weights
      const { data: lastWeights } = await supabase
        .from('hourly_weights')
        .select('hour_start, percentage')
        .eq('session_id', lastSession.id);

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
  }
};
