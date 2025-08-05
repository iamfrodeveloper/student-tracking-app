// Database types for the Student Tracking App

export interface Student {
  student_id: number;
  name: string;
  class: string;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
    parent_name?: string;
    parent_phone?: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  payment_id: number;
  student_id: number;
  amount: number;
  month: number;
  year: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: Date;
  payment_method?: string;
  notes?: string;
  created_at: Date;
}

export interface Test {
  test_id: number;
  student_id: number;
  subject: string;
  score: number;
  total_marks: number;
  percentage: number;
  date: Date;
  test_type: 'quiz' | 'midterm' | 'final' | 'assignment' | 'project';
  notes?: string;
  created_at: Date;
}

export interface Conversation {
  id: number;
  user_id: string;
  query: string;
  response: string;
  audio_file_path?: string;
  query_type: 'text' | 'audio';
  processing_time?: number;
  created_at: Date;
}

export interface AppConfigDB {
  id: number;
  user_id: string;
  config_key: string;
  config_value: string;
  created_at: Date;
  updated_at: Date;
}

// Vector database types
export interface VectorPoint {
  id: string;
  vector: number[];
  payload: {
    student_id: number;
    content: string;
    content_type: 'note' | 'behavior' | 'achievement' | 'concern';
    date: string;
    metadata?: Record<string, any>;
  };
}

export interface StudentNote {
  id: string;
  student_id: number;
  content: string;
  content_type: 'note' | 'behavior' | 'achievement' | 'concern';
  date: Date;
  created_by: string;
  metadata?: Record<string, any>;
}

// Query types
export interface StudentQuery {
  student_id?: number;
  name?: string;
  class?: string;
  limit?: number;
  offset?: number;
}

export interface PaymentQuery {
  student_id?: number;
  month?: number;
  year?: number;
  status?: Payment['status'];
  limit?: number;
  offset?: number;
}

export interface TestQuery {
  student_id?: number;
  subject?: string;
  test_type?: Test['test_type'];
  date_from?: Date;
  date_to?: Date;
  limit?: number;
  offset?: number;
}

// Sample data types
export interface SampleData {
  students: Omit<Student, 'student_id' | 'created_at' | 'updated_at'>[];
  payments: Omit<Payment, 'payment_id' | 'created_at'>[];
  tests: Omit<Test, 'test_id' | 'created_at'>[];
  notes: Omit<StudentNote, 'id' | 'date' | 'created_by'>[];
}
