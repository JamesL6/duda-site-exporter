-- Create ENUM types for job status and log levels
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE log_level AS ENUM ('info', 'warn', 'error');

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    status job_status NOT NULL DEFAULT 'pending',
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    storage_path TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create logs table
CREATE TABLE logs (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    level log_level NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_logs_job_id ON logs(job_id);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to jobs table
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs table
-- Users can view their own jobs
CREATE POLICY "Users can view own jobs"
    ON jobs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can insert own jobs"
    ON jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only service role can update jobs (worker uses service role)
CREATE POLICY "Service role can update jobs"
    ON jobs FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- RLS Policies for logs table
-- Users can view logs for their own jobs
CREATE POLICY "Users can view logs for own jobs"
    ON logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = logs.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- Service role can insert logs
CREATE POLICY "Service role can insert logs"
    ON logs FOR INSERT
    WITH CHECK (true);

-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can download their own exports
CREATE POLICY "Users can download own exports"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'exports' AND
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.storage_path = storage.objects.name
            AND jobs.user_id = auth.uid()
        )
    );

-- Service role can upload exports
CREATE POLICY "Service role can upload exports"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'exports');
