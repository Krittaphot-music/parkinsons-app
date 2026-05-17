import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggaxjbwvyyoywcttlkfs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnYXhqYnd2eXlveXdjdHRsa2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0Nzc4NDMsImV4cCI6MjA5NDA1Mzg0M30.XNB2GwKiD3J8Dm6Kt43YwjSN55vsGDtNI7y2PifhRU8'

export const supabase = createClient(supabaseUrl, supabaseKey)
