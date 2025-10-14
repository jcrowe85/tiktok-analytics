--
-- PostgreSQL database dump
--

\restrict NZAnmYXoCkkO4Qno41igli45tUpXL1LxLflnnHiBKsGAMYgUnfiaIfodGZikBg4

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: tiktok_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO tiktok_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: job_status; Type: TABLE; Schema: public; Owner: tiktok_user
--

CREATE TABLE public.job_status (
    id integer NOT NULL,
    job_id character varying(255) NOT NULL,
    video_id character varying(255),
    job_type character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    progress integer DEFAULT 0,
    data jsonb DEFAULT '{}'::jsonb,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    CONSTRAINT job_status_status_check CHECK (((status)::text = ANY ((ARRAY['waiting'::character varying, 'active'::character varying, 'completed'::character varying, 'failed'::character varying, 'delayed'::character varying])::text[])))
);


ALTER TABLE public.job_status OWNER TO tiktok_user;

--
-- Name: job_status_id_seq; Type: SEQUENCE; Schema: public; Owner: tiktok_user
--

CREATE SEQUENCE public.job_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_status_id_seq OWNER TO tiktok_user;

--
-- Name: job_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiktok_user
--

ALTER SEQUENCE public.job_status_id_seq OWNED BY public.job_status.id;


--
-- Name: user_oauth_states; Type: TABLE; Schema: public; Owner: tiktok_user
--

CREATE TABLE public.user_oauth_states (
    id integer NOT NULL,
    user_id integer NOT NULL,
    state character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    code_verifier text
);


ALTER TABLE public.user_oauth_states OWNER TO tiktok_user;

--
-- Name: TABLE user_oauth_states; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON TABLE public.user_oauth_states IS 'Temporary storage for OAuth state parameters and PKCE code verifiers during TikTok authentication';


--
-- Name: COLUMN user_oauth_states.user_id; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.user_oauth_states.user_id IS 'User initiating the OAuth flow';


--
-- Name: COLUMN user_oauth_states.state; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.user_oauth_states.state IS 'Unique state parameter for CSRF protection';


--
-- Name: COLUMN user_oauth_states.expires_at; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.user_oauth_states.expires_at IS 'When this state expires (typically 10 minutes)';


--
-- Name: COLUMN user_oauth_states.code_verifier; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.user_oauth_states.code_verifier IS 'PKCE code verifier for secure OAuth flow';


--
-- Name: user_oauth_states_id_seq; Type: SEQUENCE; Schema: public; Owner: tiktok_user
--

CREATE SEQUENCE public.user_oauth_states_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_oauth_states_id_seq OWNER TO tiktok_user;

--
-- Name: user_oauth_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiktok_user
--

ALTER SEQUENCE public.user_oauth_states_id_seq OWNED BY public.user_oauth_states.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: tiktok_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tiktok_access_token text,
    tiktok_refresh_token text,
    tiktok_open_id text,
    tiktok_username text,
    tiktok_display_name text,
    tiktok_connected_at timestamp without time zone,
    tiktok_token_expires_at timestamp without time zone,
    plan_type character varying(50) DEFAULT 'free'::character varying,
    videos_allowed integer DEFAULT 10,
    subscription_ends_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO tiktok_user;

--
-- Name: COLUMN users.tiktok_access_token; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.tiktok_access_token IS 'TikTok OAuth access token for user';


--
-- Name: COLUMN users.tiktok_refresh_token; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.tiktok_refresh_token IS 'TikTok OAuth refresh token for user';


--
-- Name: COLUMN users.tiktok_open_id; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.tiktok_open_id IS 'TikTok unique user identifier';


--
-- Name: COLUMN users.tiktok_username; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.tiktok_username IS 'TikTok username/handle (e.g., @username)';


--
-- Name: COLUMN users.tiktok_display_name; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.tiktok_display_name IS 'TikTok display name';


--
-- Name: COLUMN users.tiktok_connected_at; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.tiktok_connected_at IS 'When user connected their TikTok account';


--
-- Name: COLUMN users.tiktok_token_expires_at; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.tiktok_token_expires_at IS 'When the access token expires';


--
-- Name: COLUMN users.plan_type; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.plan_type IS 'User subscription plan (free/paid/enterprise)';


--
-- Name: COLUMN users.videos_allowed; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.videos_allowed IS 'Number of videos user can analyze based on plan';


--
-- Name: COLUMN users.subscription_ends_at; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.users.subscription_ends_at IS 'When paid subscription expires';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: tiktok_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO tiktok_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiktok_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: video_ai_analysis; Type: TABLE; Schema: public; Owner: tiktok_user
--

CREATE TABLE public.video_ai_analysis (
    id integer NOT NULL,
    video_id character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying,
    processed_at timestamp without time zone,
    processing_time_ms integer,
    rules_version integer DEFAULT 1,
    asr_engine character varying(50),
    ocr_engine character varying(50),
    vision_model character varying(50),
    llm_model character varying(50),
    content_hash character varying(64),
    detected_language character varying(10),
    scores jsonb DEFAULT '{}'::jsonb NOT NULL,
    visual_scores jsonb DEFAULT '{}'::jsonb NOT NULL,
    classifiers jsonb DEFAULT '{}'::jsonb NOT NULL,
    findings jsonb DEFAULT '{}'::jsonb,
    fix_suggestions text[],
    artifacts jsonb DEFAULT '{}'::jsonb,
    quality_band character varying(20),
    policy_flags text[],
    platform_blockers text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer,
    CONSTRAINT video_ai_analysis_quality_band_check CHECK (((quality_band)::text = ANY ((ARRAY['Pass'::character varying, 'Revise'::character varying, 'Reshoot'::character varying])::text[]))),
    CONSTRAINT video_ai_analysis_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.video_ai_analysis OWNER TO tiktok_user;

--
-- Name: video_ai_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: tiktok_user
--

CREATE SEQUENCE public.video_ai_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_ai_analysis_id_seq OWNER TO tiktok_user;

--
-- Name: video_ai_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiktok_user
--

ALTER SEQUENCE public.video_ai_analysis_id_seq OWNED BY public.video_ai_analysis.id;


--
-- Name: videos; Type: TABLE; Schema: public; Owner: tiktok_user
--

CREATE TABLE public.videos (
    id character varying(255) NOT NULL,
    username character varying(255),
    caption text,
    video_description text,
    hashtags text[],
    posted_at_iso timestamp without time zone,
    create_time bigint,
    duration integer,
    view_count integer,
    like_count integer,
    comment_count integer,
    share_count integer,
    engagement_rate numeric(10,8),
    like_rate numeric(10,8),
    comment_rate numeric(10,8),
    share_rate numeric(10,8),
    views_24h integer,
    velocity_24h numeric(10,8),
    share_url text,
    embed_link text,
    cover_image_url text,
    video_title text,
    author_username character varying(255),
    author_nickname character varying(255),
    author_avatar_url text,
    music_title character varying(255),
    music_artist character varying(255),
    is_adhoc boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer
);


ALTER TABLE public.videos OWNER TO tiktok_user;

--
-- Name: job_status id; Type: DEFAULT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.job_status ALTER COLUMN id SET DEFAULT nextval('public.job_status_id_seq'::regclass);


--
-- Name: user_oauth_states id; Type: DEFAULT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.user_oauth_states ALTER COLUMN id SET DEFAULT nextval('public.user_oauth_states_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: video_ai_analysis id; Type: DEFAULT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_ai_analysis ALTER COLUMN id SET DEFAULT nextval('public.video_ai_analysis_id_seq'::regclass);


--
-- Name: job_status job_status_job_id_key; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.job_status
    ADD CONSTRAINT job_status_job_id_key UNIQUE (job_id);


--
-- Name: job_status job_status_pkey; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.job_status
    ADD CONSTRAINT job_status_pkey PRIMARY KEY (id);


--
-- Name: user_oauth_states user_oauth_states_pkey; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.user_oauth_states
    ADD CONSTRAINT user_oauth_states_pkey PRIMARY KEY (id);


--
-- Name: user_oauth_states user_oauth_states_state_key; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.user_oauth_states
    ADD CONSTRAINT user_oauth_states_state_key UNIQUE (state);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: video_ai_analysis video_ai_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_ai_analysis
    ADD CONSTRAINT video_ai_analysis_pkey PRIMARY KEY (id);


--
-- Name: video_ai_analysis video_ai_analysis_video_id_key; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_ai_analysis
    ADD CONSTRAINT video_ai_analysis_video_id_key UNIQUE (video_id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: idx_job_status_created_at; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_job_status_created_at ON public.job_status USING btree (created_at DESC);


--
-- Name: idx_job_status_job_id; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_job_status_job_id ON public.job_status USING btree (job_id);


--
-- Name: idx_job_status_status; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_job_status_status ON public.job_status USING btree (status);


--
-- Name: idx_job_status_video_id; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_job_status_video_id ON public.job_status USING btree (video_id);


--
-- Name: idx_user_oauth_states_expires_at; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_user_oauth_states_expires_at ON public.user_oauth_states USING btree (expires_at);


--
-- Name: idx_user_oauth_states_state; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_user_oauth_states_state ON public.user_oauth_states USING btree (state);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_plan_type; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_users_plan_type ON public.users USING btree (plan_type);


--
-- Name: idx_users_tiktok_open_id; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_users_tiktok_open_id ON public.users USING btree (tiktok_open_id);


--
-- Name: idx_users_tiktok_username; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_users_tiktok_username ON public.users USING btree (tiktok_username);


--
-- Name: idx_video_ai_analysis_classifiers; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_ai_analysis_classifiers ON public.video_ai_analysis USING gin (classifiers);


--
-- Name: idx_video_ai_analysis_policy_flags; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_ai_analysis_policy_flags ON public.video_ai_analysis USING gin (policy_flags);


--
-- Name: idx_video_ai_analysis_processed_at; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_ai_analysis_processed_at ON public.video_ai_analysis USING btree (processed_at DESC);


--
-- Name: idx_video_ai_analysis_scores; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_ai_analysis_scores ON public.video_ai_analysis USING gin (scores);


--
-- Name: idx_video_ai_analysis_status; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_ai_analysis_status ON public.video_ai_analysis USING btree (status);


--
-- Name: idx_video_ai_analysis_user_id; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_ai_analysis_user_id ON public.video_ai_analysis USING btree (user_id);


--
-- Name: idx_video_ai_analysis_video_id; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_ai_analysis_video_id ON public.video_ai_analysis USING btree (video_id);


--
-- Name: idx_video_ai_analysis_visual_scores; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_ai_analysis_visual_scores ON public.video_ai_analysis USING gin (visual_scores);


--
-- Name: idx_videos_author_username; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_videos_author_username ON public.videos USING btree (author_username);


--
-- Name: idx_videos_is_adhoc; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_videos_is_adhoc ON public.videos USING btree (is_adhoc);


--
-- Name: idx_videos_music_title; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_videos_music_title ON public.videos USING btree (music_title);


--
-- Name: idx_videos_share_url; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_videos_share_url ON public.videos USING btree (share_url);


--
-- Name: idx_videos_user_id; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_videos_user_id ON public.videos USING btree (user_id);


--
-- Name: idx_videos_username; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_videos_username ON public.videos USING btree (username);


--
-- Name: idx_videos_video_title; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_videos_video_title ON public.videos USING btree (video_title);


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: tiktok_user
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: video_ai_analysis update_video_ai_analysis_updated_at; Type: TRIGGER; Schema: public; Owner: tiktok_user
--

CREATE TRIGGER update_video_ai_analysis_updated_at BEFORE UPDATE ON public.video_ai_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: videos update_videos_updated_at; Type: TRIGGER; Schema: public; Owner: tiktok_user
--

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_oauth_states user_oauth_states_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.user_oauth_states
    ADD CONSTRAINT user_oauth_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_ai_analysis video_ai_analysis_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_ai_analysis
    ADD CONSTRAINT video_ai_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_ai_analysis video_ai_analysis_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_ai_analysis
    ADD CONSTRAINT video_ai_analysis_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: videos videos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NZAnmYXoCkkO4Qno41igli45tUpXL1LxLflnnHiBKsGAMYgUnfiaIfodGZikBg4

