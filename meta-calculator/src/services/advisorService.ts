import { supabase } from '../lib/supabase';
import type { DailySession, HourlyWeight, Advisor, AdvisorAvailability } from '../types';

export interface AdvisorContext {
  advisor: Advisor;
  session: DailySession;
  weights: HourlyWeight[];
  availability: AdvisorAvailability[];
  allAdvisors: Advisor[];
  allAvailability: AdvisorAvailability[];
}

export const advisorService = {
  async getAdvisorByToken(token: string): Promise<AdvisorContext | null> {
    // 1. Get Advisor
    const { data: advisor, error: advError } = await supabase
      .from('advisors')
      .select('*')
      .eq('access_token', token)
      .single();
    
    if (advError || !advisor) return null;

    // 2. Get Session
    const { data: session, error: sessionError } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('id', advisor.session_id)
      .single();
      
    if (sessionError || !session) return null;

    // 3. Get Weights
    const { data: weights, error: weightsError } = await supabase
      .from('hourly_weights')
      .select('*')
      .eq('session_id', session.id);

    if (weightsError) throw new Error(`Error fetching weights: ${weightsError.message}`);

    // 4. Get All Advisors for Session
    const { data: allAdvisors, error: allAdvError } = await supabase
      .from('advisors')
      .select('*')
      .eq('session_id', session.id);

    if (allAdvError) throw new Error(`Error fetching all advisors: ${allAdvError.message}`);

    // 5. Get All Availability for Session Advisors
    const advisorIds = allAdvisors.map(a => a.id);
    const { data: allAvailability, error: allAvailError } = await supabase
      .from('advisor_availability')
      .select('*')
      .in('advisor_id', advisorIds);

    if (allAvailError) throw new Error(`Error fetching all availability: ${allAvailError.message}`);

    // Filter current advisor's availability for backward compatibility/convenience
    const availability = allAvailability.filter(a => a.advisor_id === advisor.id);

    return {
      advisor,
      session,
      weights: weights || [],
      availability: availability || [],
      allAdvisors: allAdvisors || [],
      allAvailability: allAvailability || []
    };
  },

  async updateSales(advisorId: string, totalSales: number, tickets: number): Promise<void> {
    const { error } = await supabase
      .from('advisors')
      .update({ total_sales: totalSales, tickets_count: tickets })
      .eq('id', advisorId);
      
    if (error) throw new Error(`Error updating sales: ${error.message}`);
  }
};
