export interface CalendlyConnection {
  connected: boolean;
  user_id: number | null;
  calendly_user_name: string | null;
  scheduling_url: string | null;
  last_synced_at: string | null;
}

export interface CalendlySalesRep {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  connected: boolean;
  scheduling_url: string | null;
  last_synced_at: string | null;
}

export interface CalendlyEvent {
  id: number;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type_name: string | null;
  event_type_uri: string | null;
  invitee_name: string | null;
  invitee_email: string | null;
  invitee_comment: string | null;
  location: string | null;
  meeting_url: string | null;
  prospect_id?: number | null;
}

export interface CalendlyCustomQuestion {
  uuid: string;
  name: string;
  type: string;
  position: number;
  required: boolean;
  enabled: boolean;
  answer_choices: string[] | null;
  include_other: boolean | null;
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  duration: number;
  scheduling_url: string | null;
  description: string | null;
  custom_questions: CalendlyCustomQuestion[];
}

export interface CalendlyAvailableTime {
  start_time: string;
  status: string;
}

export interface CalendlyQuestionAnswer {
  question_uuid: string;
  answer: string;
}

export interface CalendlyEventFormValues {
  event_type_uri: string;
  start_time: string;
  invitee_name: string;
  invitee_email: string;
  questions_and_answers: CalendlyQuestionAnswer[];
}
