--
-- PostgreSQL database dump
--

\restrict IQQbz4bHRsejyT3zcYdPcB3fNbQ0ygW2JBfAu5J1nCoLC4d3llkdu9vs0q8oRbR

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
-- Name: video_snapshots; Type: TABLE; Schema: public; Owner: tiktok_user
--

CREATE TABLE public.video_snapshots (
    id integer NOT NULL,
    video_id character varying(255) NOT NULL,
    user_id integer NOT NULL,
    snapshot_date date NOT NULL,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.video_snapshots OWNER TO tiktok_user;

--
-- Name: TABLE video_snapshots; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON TABLE public.video_snapshots IS 'Daily snapshots of video metrics for tracking growth over time';


--
-- Name: COLUMN video_snapshots.snapshot_date; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.video_snapshots.snapshot_date IS 'The date this snapshot was taken (without time)';


--
-- Name: COLUMN video_snapshots.view_count; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.video_snapshots.view_count IS 'Total view count at the time of snapshot';


--
-- Name: COLUMN video_snapshots.like_count; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.video_snapshots.like_count IS 'Total like count at the time of snapshot';


--
-- Name: COLUMN video_snapshots.comment_count; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.video_snapshots.comment_count IS 'Total comment count at the time of snapshot';


--
-- Name: COLUMN video_snapshots.share_count; Type: COMMENT; Schema: public; Owner: tiktok_user
--

COMMENT ON COLUMN public.video_snapshots.share_count IS 'Total share count at the time of snapshot';


--
-- Name: video_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: tiktok_user
--

CREATE SEQUENCE public.video_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_snapshots_id_seq OWNER TO tiktok_user;

--
-- Name: video_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tiktok_user
--

ALTER SEQUENCE public.video_snapshots_id_seq OWNED BY public.video_snapshots.id;


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
-- Name: video_snapshots id; Type: DEFAULT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_snapshots ALTER COLUMN id SET DEFAULT nextval('public.video_snapshots_id_seq'::regclass);


--
-- Data for Name: job_status; Type: TABLE DATA; Schema: public; Owner: tiktok_user
--

COPY public.job_status (id, job_id, video_id, job_type, status, progress, data, error_message, created_at, started_at, completed_at) FROM stdin;
\.


--
-- Data for Name: user_oauth_states; Type: TABLE DATA; Schema: public; Owner: tiktok_user
--

COPY public.user_oauth_states (id, user_id, state, expires_at, created_at, code_verifier) FROM stdin;
36	6	6_1760447377367_5tu6uvlfciw	2025-10-14 13:19:37.369	2025-10-14 13:09:37.369894	
37	6	6_1760447401283_n8ilcujv0s	2025-10-14 13:20:01.283	2025-10-14 13:10:01.28419	
42	6	6_1760483748832_qrgq3l349f	2025-10-14 23:25:48.832	2025-10-14 23:15:48.833278	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: tiktok_user
--

COPY public.users (id, email, password_hash, name, created_at, updated_at, tiktok_access_token, tiktok_refresh_token, tiktok_open_id, tiktok_username, tiktok_display_name, tiktok_connected_at, tiktok_token_expires_at, plan_type, videos_allowed, subscription_ends_at) FROM stdin;
8	team@tryfleur.com	$2a$10$lQEbSCxGBN5Omthi1RI7qesfs73yRvubZw5NPixbJleXa9MKXoxoa	Team Fleur	2025-10-14 13:15:41.263514	2025-10-14 13:17:06.269609	act.1D47Y5hCcQa00EmK9cfXZfQtGDpx3Fb2Om4oqPQYRD08fRGoFKEmepCqVkHG!6442.u1	rft.uM4WOiW1XOnrhvPjGaQpuLIOXfQLtfxYFFyRiFEFSXIbJPGKFhg86nTbZPQ8!6373.u1	-0002UMtGSnYMtXhbERbbvVQzqg5NvPaJOfe	tryfleur	TryFleur	2025-10-14 13:17:06.269609	2025-10-15 13:17:06.269	free	10	\N
6	jcrowe120485@gmail.com	$2a$10$MvIjyJXernPZ5VPu7KGMmOxoRnM4jmIyXncckg5wFMBUrZHqBRNti	Joshua Crowe	2025-10-14 13:06:13.714364	2025-10-14 23:16:36.335498	act.3np9na1vvleKzUtvrTReLk2FQfFtLqni6nT0DtammhwuDP8jZHefOAmgXSo7!6442.u1	rft.wv5kk9GgIYFD9lzJGJZqjProaP5hYef30hY2dNmsE9cRhK2mkYr9lQBO8iGd!6432.u1	-000k-wc7Gnu0pUWcIFeTohW83cm1i5gHd6r	joshuacrowe	Joshua Crowe	2025-10-14 23:16:36.335498	2025-10-15 23:16:36.335	free	10	\N
\.


--
-- Data for Name: video_ai_analysis; Type: TABLE DATA; Schema: public; Owner: tiktok_user
--

COPY public.video_ai_analysis (id, video_id, status, processed_at, processing_time_ms, rules_version, asr_engine, ocr_engine, vision_model, llm_model, content_hash, detected_language, scores, visual_scores, classifiers, findings, fix_suggestions, artifacts, quality_band, policy_flags, platform_blockers, created_at, updated_at, user_id) FROM stdin;
62	7558985563248823607	completed	2025-10-14 14:22:41.767	\N	1	whisper-1	google-vision	google-vision	gpt-4o	e5de6645f6724d18	en	{"cta": 1, "depth": 3, "pacing": 3, "clarity": 2, "brand_fit": 4, "overall_100": 25, "hook_strength": 4}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "No clear call-to-action is present; viewers are not directed towards any specific action or engagement.", "depth": "The video provides a minimal insight into the confidence gained from using a product, but lacks specifics or detailed information.", "pacing": "The pacing is uneven, with text and message appearing jumbled, causing a loss of focus halfway through.", "clarity": "The message is difficult to follow due to repetitive and fragmented on-screen text, making it hard to grasp the core idea.", "brand_fit": "The video attempts to fit within TikTok's beauty and self-improvement niche but fails to leverage engaging trends or clear storytelling.", "hook_strength": "The opening lacks a strong hook; it starts with a vague statement which doesn't immediately grab attention."}	{"Start with a more compelling hook that directly addresses a common problem or curiosity.","Incorporate specific examples or testimonials to enhance depth and credibility.","Simplify the on-screen text and ensure it aligns with the spoken message for better clarity.","Develop a clear and compelling CTA that encourages viewer interaction or product inquiry.","Consider aligning with popular TikTok formats or trends to improve engagement and brand fit."}	{"ocr_text": ["used to be so insecure about my\\nactually needed.", "used to be so insecure about my\\nnatural hair.\\nYeah, me too.... until I finally learned what my hair\\nactually needed.", "4 used to be so insecure about my\\nactually needed.", "it", "used to be so insecure about my\\nactually needed.", "That's when I found Bloom. Fuller, thicker,\\nstronger hair and my confidence came back with\\nit", "That's when I found Bloom. Fuller, thicker,\\nstronger hair and may confidence came back with\\nit\\nBecause watching my hair com\\nreminded melcould too. Bloomer\\nmy shine, Insicio and out.\\nEkstronger\\nmo back", "That's when I found Bloom. Fuller, thicker,\\nstronger hair and may confidence came back with\\nBC\\nBecause watching my hair com\\nreminded melcould too. Bloom\\nmy shine, Insicio and out.\\nstronger"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_2.1s.jpg", "timestamp": 2.13333325}, {"filename": "frame_4.3s.jpg", "timestamp": 4.2666665}, {"filename": "frame_6.4s.jpg", "timestamp": 6.399999750000001}, {"filename": "frame_7.5s.jpg", "timestamp": 7.533333000000001}], "transcript": "Just trust me, you'll be fine, and when I'm done"}	\N	\N	\N	2025-10-14 14:22:13.842198	2025-10-14 14:22:41.768176	\N
66	7559093535841013022	completed	2025-10-14 14:51:31.026	\N	1	whisper-1	google-vision	google-vision	gpt-4o	ecd4a21acf03b05f	en	{"cta": 5, "depth": 8, "pacing": 3, "clarity": 6, "brand_fit": 4, "overall_100": 50, "hook_strength": 4}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "The CTA is mentioned at the end, asking viewers to follow and join a free school, but it lacks specificity and a sense of urgency.", "depth": "Delivers substantial information about three peptides, with some statistics and explanations of their functions.", "pacing": "The video is lengthy for TikTok, and the delivery is relatively monotonous, lacking dynamic shifts to maintain viewer engagement.", "clarity": "The message is somewhat clear but is muddled by technical jargon that might be hard for a general audience to follow.", "brand_fit": "The content feels more like an infomercial than native TikTok content; it's too lengthy and technical for typical TikTok engagement.", "hook_strength": "The video begins with a common misconception about hair follicles, which might not immediately captivate the audience."}	{"Introduce a more engaging hook in the first 3 seconds to draw viewers in immediately.","Simplify the jargon and use layman's terms to make the information more accessible.","Incorporate more visual variety and quicker cuts to improve pacing and maintain interest.","Position the CTA earlier in the video with a clear, compelling reason for viewers to act."}	{"ocr_text": ["3 Peptides to\\nThicken &\\nRegrow Hair", "3 Peptides to\\nThicken &\\nRegrow Hair\\nstruggling with", "3 Peptides to\\nThicken &\\nRegrow Hair\\nthink", "3 Peptides to\\nThicken\\nRegrow Hair\\nfollicles", "sepnded b", "hair follici", "B\\nBUIPPOS", "nutrients", "make sure that you\\nG"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_10.0s.jpg", "timestamp": 10}, {"filename": "frame_46.4s.jpg", "timestamp": 46.3875}, {"filename": "frame_92.8s.jpg", "timestamp": 92.775}, {"filename": "frame_139.2s.jpg", "timestamp": 139.16250000000002}, {"filename": "frame_184.6s.jpg", "timestamp": 184.55}], "transcript": "Most people struggling with thinning hair think their follicles are dead. But there's three peptides that are changing what's possible when it comes to hair. You see, 90% of the time, the hair follicles aren't dead. They're just sleeping, hidden underneath the scalp. The architecture is still there. It's just waiting to be reactivated. And these three peptides just figured how to wake them up. Number one. GHKCU is the cell reset button your hair has been begging for. This copper peptide not only stimulates new growth by directly activating the genes that tell your cells to rebuild, repair, regrow. In clinical studies, 70% of participants had increased hair thickness and 30-50% reduction in shedding after just 8 weeks. Pretty cool. But here's the crazy part. GHKCU also fixes your scalp's collagen problem. It destroys the brittle, aged collagen that's clogging and suffocating the hair follicles. And at the same time, it tells your cells exactly where to put the new, fresh collagen. Right where your hair needs it most. Number two. TB500 is the stem cell activator that brings dead zones back to life. This peptide activates dormant hair stem cells and puts them into a growth phase. In animal studies, it doubled the number of active hair follicles in just 7 days. TB500 works by cranking up VEGF, which builds new vessels around and to the roots. Of course, more blood flow equals more nutrients and more oxygen to your hair roots. Number three. PTD-DBM. This is a topical peptide that actually helps generate new hair from scratch. You see, the other peptides we talked about wake up and reactivate existing follicles. This peptide creates entirely new ones by blocking a protein called CXXC5. It's a protein that prevents follicle formation. Studies on bald mice showed new hair growth after just 28 days of topical application. It works by reactivating the Wnt pathway. You can think of this as a master switch for new follicle development. It basically turns it on. It's pretty cool. In some ways, it's like complete hair resurrection. Because together, these three peptides attack hair loss from multiple angles. GHK rebuilds the scalp's foundational function. TB500 wakens up and reactivates those sleeping roots. And PTD-DBM makes entirely new ones. And that's why the future of hair restoration might not be expensive trips to Turkey for hair transplants or using treatments that make you pay a heavy price with pretty nasty side effects to get that hair back. And for sure, the future isn't just accepting hair loss. I believe it's peptides like this that reprogram your scalp at the foundational level. For more peptides like this that actually work and actually do something, please follow and then join me in my free school. There we'll have the exact protocols and a supportive, open, connected conversation and a community there to make sure that you can hit your goals."}	\N	\N	\N	2025-10-14 14:51:10.37781	2025-10-14 14:51:31.027216	\N
68	7558975027060755725	completed	2025-10-15 01:02:59.336	\N	1	whisper-1	google-vision	google-vision	gpt-4o	4e2f1c190ebd7b1f	en	{"cta": 0, "depth": 1, "pacing": 2, "clarity": 4, "brand_fit": 2, "overall_100": 21, "hook_strength": 3}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "There is no clear call-to-action present in the video, leaving viewers without guidance on what to do next.", "depth": "The content delivers no substantial information, insights, or value about the product or its benefits.", "pacing": "The pacing is erratic with no clear flow, making it hard to maintain viewer interest.", "clarity": "The message is difficult to understand due to repetitive and confusing text overlays.", "brand_fit": "The video does not align well with typical TikTok content, lacking both trend alignment and engaging elements.", "hook_strength": "The video starts with a vague statement that lacks a clear hook or attention-grabbing element."}	{"Start with a clear and intriguing hook to capture attention immediately.","Include specific information or testimonials about the product to add depth.","Simplify and clarify the on-screen text to enhance message delivery.","Improve pacing with more dynamic edits and a consistent flow.","Incorporate a strong and clear call-to-action to guide viewer interaction."}	{"ocr_text": ["When I realized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nhill's just brushed it.", "When Frealized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nhill's just bar shedIS\\nh", "When Frealized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nil's I just brushed it", "When Frealized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nsi just brushed it", "When Frealized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nhill's I just brushe dit", "When Frealized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nhill's just brushed it.", "When I realized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nhed it", "When I realized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nhills i just brushed it.", "When I realized Bloom Peptide Hair Serum's\\nbeen\\nking 365 days a year to grow my\\nMoi just brushed it"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_1.4s.jpg", "timestamp": 1.44166675}, {"filename": "frame_2.9s.jpg", "timestamp": 2.8833335}, {"filename": "frame_4.3s.jpg", "timestamp": 4.32500025}, {"filename": "frame_4.8s.jpg", "timestamp": 4.766667}], "transcript": "I mean, I didn't realize that it was like literally seven days a week, 365 days a year."}	\N	\N	\N	2025-10-15 01:02:29.761354	2025-10-15 01:02:59.338208	\N
70	7558932757750107405	completed	2025-10-15 01:03:34.366	\N	1	whisper-1	google-vision	google-vision	gpt-4o	23975602a8ad1528	en	{"cta": 1, "depth": 2, "pacing": 4, "clarity": 3, "brand_fit": 2, "overall_100": 22, "hook_strength": 3}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "There is no clear call-to-action; the message seems intended to inform but lacks direction or urgency.", "depth": "The content is overly repetitive and fails to provide any substantive information or insights.", "pacing": "The video is too short to establish a rhythm, and the repetition of text without dynamic changes makes it monotonous.", "clarity": "The message is muddled by numerous typographical errors and inconsistencies, making it difficult to understand.", "brand_fit": "The video does not align well with typical successful TikTok content due to its lack of engagement and clarity.", "hook_strength": "The video starts with a vague statement, lacking a strong hook or curiosity element."}	{"Begin with a clear, engaging statement or question that captures viewer interest immediately.","Introduce new, actionable information or a unique perspective to add depth.","Correct typographical errors to improve clarity and message coherence.","Incorporate dynamic visuals or varying text overlays to enhance pacing.","Include a strong, specific call-to-action that directs viewers towards a next step."}	{"ocr_text": ["If only Tik Tok would show this\\nto everyone dealing with\\nreadinning oorgrowthd\\nrestore your strands with\\npeptides this year", "If only Tik Tok would show this\\nto everyone dealing with\\nread start growth and\\nrestore your strands with\\npeptides this year", "If only Tik Tok would show this\\nto everyone dealing with\\nthinning hair or hair loss...\\nready to jumpstart growth and\\nrestore your strands with\\npeptides this year", "If only Tik Tok would show this\\nto everyone dealing with\\nread jumpstar hair loss and\\nrestore your strands with\\npeptides this year", "If only Tik Tok would show this\\nto everyone dealing with\\nthinning hair or hair loss...\\nready to jumpstart growth and\\nrestore your strands with\\npeptides this year-", "If only Tik Tok would show this\\nto everyone dealing with\\nreadniesinar or growth and\\nrestore your strands with\\npeptides this year", "If only Tik Tok would show this\\nto everyone dealing with\\nready to jumpair of grow and\\nrestore your strands with\\npeptides this year", "If only Tik Tok would show this\\nnning her hair\\nready to jumpstart growth and\\npeptides this year", "reanair fosend\\nIf only Tik Tok would show this\\nrestore your strands with\\npeptides this year"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_1.3s.jpg", "timestamp": 1.28824825}, {"filename": "frame_2.6s.jpg", "timestamp": 2.5764965}, {"filename": "frame_3.9s.jpg", "timestamp": 3.8647447500000003}, {"filename": "frame_4.2s.jpg", "timestamp": 4.152993}], "transcript": "It would be so awesome. It would be so cool."}	\N	\N	\N	2025-10-15 01:03:14.898462	2025-10-15 01:03:34.367296	\N
72	7558621254396169486	completed	2025-10-15 01:03:50.5	\N	1	whisper-1	google-vision	google-vision	gpt-4o	b75b5a6473e1c4ef	en	{"cta": 3, "depth": 3, "pacing": 4, "clarity": 5, "brand_fit": 5, "overall_100": 38, "hook_strength": 4}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "The call-to-action to visit the TikTok Shop appears at the end but is not noticeable or compelling enough to drive action.", "depth": "The video repeats the same message about Bloom Peptide Hair Serum without providing detailed information or evidence of effectiveness.", "pacing": "The pacing is slow and repetitive, with the same text and message shown multiple times, causing it to lose engagement quickly.", "clarity": "The on-screen text is cluttered and includes typos, making the message hard to follow and understand clearly.", "brand_fit": "While it attempts to follow a promotional format, the execution does not align well with typical engaging TikTok content.", "hook_strength": "The video starts with a short, non-descriptive sound 'Heh. Oh boy.' which lacks a strong hook and doesn't immediately capture attention."}	{"Introduce a strong visual or question in the first 3 seconds to create a more compelling hook.","Include specific benefits or success stories of the product to add depth and credibility.","Simplify on-screen text and correct typos to enhance clarity.","Vary the visuals and message to improve pacing and maintain viewer interest.","Strengthen the CTA by highlighting a unique selling proposition and creating urgency."}	{"ocr_text": ["When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum... >>", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum... >", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum... >", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum... >>", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum....\\nFormulated wiGHTS Cm Copper Peptide +5\\ngrowth tacorosatima pxspatices, it works at the\\nfoot toreactivatedormant folliclesand\\nstrengthen every strand.", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum...\\nFormulated wi\\ngrowth-boot\\nroot to reacti\\nCopper Peptide +5\\nworks at the\\nmant follicles and\\nstrengthen every strand\\nIt works for both men and\\nwomen stap tho Tik Tok Shop\\nand start your growth journoy\\ntoxlay", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum... >>", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum... >>\\nFormulated wiGHTS CM Copper Peptide +5\\ngrowth tacorosaltres peptides, it works at the\\nFoot toreactivato dormant folliclesand\\nstrengthenovy strand.", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum... >>\\nFormulated with GHK GU\\nCopper Peptide\\ngrowth boostin peptides, it works at the\\nroot to reactivate diermant follicles and\\nstrengthen every strand.\\nIt works for both men and\\nwomen Tap tho Tik Tok Shop\\nand start your growth journey\\ntexlay", "When my guy friend says he's\\nbeen struggling with hair loss...\\nbut still hasn't tried Bloom\\nPeptide Hair Serum... >>\\nFormulated wit\\ngrowth book\\nroot torac\\nstrength\\nper Peptide +5\\nIt works at the\\nant follicles and\\nstrand.\\nIt works for both men and\\nwomen Tap the TIKTOR&hop\\nand start your growth journey"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_10.0s.jpg", "timestamp": 10}, {"filename": "frame_3.0s.jpg", "timestamp": 2.96}, {"filename": "frame_5.9s.jpg", "timestamp": 5.92}, {"filename": "frame_8.9s.jpg", "timestamp": 8.879999999999999}, {"filename": "frame_10.8s.jpg", "timestamp": 10.84}], "transcript": "Heh. Oh boy."}	\N	\N	\N	2025-10-15 01:03:34.375457	2025-10-15 01:03:50.530108	\N
74	7558558772197674254	completed	2025-10-15 01:04:11.069	\N	1	whisper-1	google-vision	google-vision	gpt-4o	37b48f04e58273cf	en	{"cta": 3, "depth": 4, "pacing": 4, "clarity": 6, "brand_fit": 5, "overall_100": 41, "hook_strength": 3}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "The call to action is present but not prominent or compelling; it lacks urgency and a clear incentive to take immediate action.", "depth": "The content provides basic information about the product and its benefits but lacks detailed insights or evidence to support claims.", "pacing": "The video maintains a consistent but monotonous pace with little variation in shots or energy, which might cause viewers to lose interest.", "clarity": "The message about the hair serum's benefits is somewhat clear, but the repetition and lack of focus can confuse viewers.", "brand_fit": "The video attempts to align with TikTok's informative content style but lacks the engaging and dynamic elements typical of successful TikTok videos.", "hook_strength": "The video starts with repeated text about hair thinning but lacks a strong visual or auditory hook to captivate immediate interest."}	{"Introduce a more engaging visual or auditory element in the first 3 seconds to strengthen the hook.","Incorporate testimonials or before-and-after visuals to provide concrete proof points.","Enhance the pacing with more dynamic cuts or varied transitions to maintain viewer interest.","Make the CTA more prominent and compelling by highlighting a unique selling proposition or limited-time offer.","Consider utilizing trending TikTok formats or challenges to better align with platform norms."}	{"ocr_text": ["Wondering what actually\\nworks for hair thinning?", "Wondering what actually\\nworks for hair thinning?", "Wondering what actually\\nworks for hair thinning?", "Wondering what actually\\nworks for hair thinning?", "BLOOM\\nBloom Peptide Hair Serum\\nClinically backed peptides that target hair loss.\\nLightweight formula that nourishes the scalp.\\nReal growth results seen by real users,", "Most people don't realize thinning starts at the\\nfollicle level, where our targeted peptides\\nmake the biggest impact.\\nNATURA\\nEALTHY\\nBLOOM\\nPeptide Hair Serum", "Our peptide complex works beneath the surface,\\nfeeding your follicles with the nutrients they've\\nbeen missing.\\nEach drop is packed with active ingredients that\\nhelp extend your hair's natural growth phase for long-term\\nresults.", "Skip the trial and error\\nShop Bloom Peptide Hair\\nSerum now on TikTok Shop and\\nwatch your hair come back\\nstronger."], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_10.0s.jpg", "timestamp": 10}, {"filename": "frame_6.3s.jpg", "timestamp": 6.28333325}, {"filename": "frame_12.6s.jpg", "timestamp": 12.5666665}, {"filename": "frame_18.8s.jpg", "timestamp": 18.849999750000002}, {"filename": "frame_24.1s.jpg", "timestamp": 24.133333}], "transcript": "I already gave you the time and the place, so don't be shy. Just come be the man I need. Tell me you got something to give. I want it. I kind of like it when you call me wonderful, whatever the type of talk it is. Come dance. I gotta know you meant it. Be the man I need."}	\N	\N	\N	2025-10-15 01:03:50.547827	2025-10-15 01:04:11.069979	\N
46	7423519320371760426	completed	2025-10-14 13:46:16.273	\N	1	whisper-1	google-vision	google-vision	gpt-4o	dd03afea997db4ff	en	{"cta": 0, "depth": 1, "pacing": 2, "clarity": 4, "brand_fit": 3, "overall_100": 19, "hook_strength": 3}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "There is no call-to-action present, leaving viewers with no direction or engagement path.", "depth": "The video offers no real value or information; the content is repetitive without any insights or takeaways.", "pacing": "The pacing is monotonous due to the constant repetition of the same phrase without any variation in delivery.", "clarity": "The message is somewhat clear but lacks context, leading to potential confusion about its intent.", "brand_fit": "The content doesn't align well with typical TikTok trends or formats, feeling more like a private joke than a public post.", "hook_strength": "The repeated phrase lacks a strong hook and does not effectively capture attention within the first few seconds."}	{"Develop a stronger hook by introducing an element of surprise or curiosity in the first few seconds.","Include an engaging storyline or context to provide depth and clarity.","Introduce a variety of visuals or changes in tone to improve pacing and maintain viewer interest.","Incorporate a clear and compelling CTA to encourage interaction or sharing.","Align content more closely with trending TikTok formats to improve platform fit."}	{"ocr_text": ["and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"can i hold it while you pee?\\"", "and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"can i hold it while you pee?\\"", "and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"cani hold it while you pee?\\"", "and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"can i hold it while you pee?\\"", "and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"can i hold it while you pee?\\"", "and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"can i hold it while you pee?\\"", "and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"can i hold it while you pee?\\"", "and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"can i hold it while you pee?\\"", "and then i go and spoil it all\\nby saying something stupid\\nlike\\n\\"cani hold it while you pee?\\""], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_1.9s.jpg", "timestamp": 1.89200125}, {"filename": "frame_3.8s.jpg", "timestamp": 3.7840025}, {"filename": "frame_5.7s.jpg", "timestamp": 5.6760037500000005}, {"filename": "frame_6.6s.jpg", "timestamp": 6.568005}], "transcript": "And then I go and spoil it all by saying something stupid like I love you."}	\N	\N	\N	2025-10-14 13:45:59.772769	2025-10-14 13:46:16.274199	\N
48	7560427315214159117	completed	2025-10-14 14:03:33.9	\N	1	whisper-1	google-vision	google-vision	gpt-4o	41b0f3f39385da4b	en	{"cta": 3, "depth": 4, "pacing": 5, "clarity": 6, "brand_fit": 5, "overall_100": 50, "hook_strength": 6}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "The CTA is weak, with no specific action encouraged or urgency created, simply mentioning personal use without prompting viewer engagement.", "depth": "The video primarily promotes a hair serum with vague claims and lacks detailed insights or specific examples of results.", "pacing": "The pacing is relatively steady but lacks dynamic changes or engaging cuts, making it feel somewhat monotonous.", "clarity": "The message focuses on promoting the hair serum, but repeated phrases and jargon like 'lightweight peptides' might confuse viewers.", "brand_fit": "The content feels more like an ad than organic TikTok content, missing elements like trending audio or visual creativity typical of the platform.", "hook_strength": "The opening mentions 'Q4' and 'mermaid hair,' which can intrigue some viewers but lacks a strong visual or audio element to immediately capture attention."}	{"Incorporate a stronger visual or audio hook in the first 3 seconds to grab attention.","Provide concrete evidence or testimonials to enhance credibility and depth.","Clarify the benefits with simpler language and reduce repetition for better clarity.","Introduce more dynamic shot changes or effects to maintain viewer interest.","Place a compelling CTA early in the video with a clear benefit to the viewer."}	{"ocr_text": ["IT'S 04 LADIES", "IT'S 04 LADIES", "TO HAVE LONG", "LUSCIOUS MERMAID HAIR", "BY THE SUMMER", "SCIENCE MEETS NATURE", "FLEUR IS WHERE", "IN EVERY DROP", "IS LITERALLY JUST", "DIFFERENCE IN MY HAIR"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_10.0s.jpg", "timestamp": 10}, {"filename": "frame_7.5s.jpg", "timestamp": 7.50833325}, {"filename": "frame_15.0s.jpg", "timestamp": 15.0166665}, {"filename": "frame_22.5s.jpg", "timestamp": 22.52499975}, {"filename": "frame_29.0s.jpg", "timestamp": 29.033333}], "transcript": "It's Q4, ladies, and I'm trying to have long, luscious mermaid hair by the summer. This Daily Hair Growth Serum from FLIR is where science meets nature. Strengthen and revive my hair with these lightweight peptides in every drop. Wear it with their Dermastamp and experience accelerated results and even deeper penetration. Soapier, fuller hair is literally just a drop away. I've been using it for about two months and I swear I'm already starting to see a difference in my hair."}	\N	\N	\N	2025-10-14 14:03:08.469386	2025-10-14 14:03:33.901594	\N
50	7560820578072923406	completed	2025-10-14 14:04:52.392	\N	1	whisper-1	google-vision	google-vision	gpt-4o	f606b01d5c58c614	en	{"cta": 2, "depth": 5, "pacing": 4, "clarity": 3, "brand_fit": 5, "overall_100": 36, "hook_strength": 4}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "The call-to-action is weak and buried within the content, lacking urgency and a clear directive.", "depth": "The video provides surface-level information about the product but lacks detailed insights or evidence to support claims.", "pacing": "The pacing is uneven, with repetitive on-screen text and a monotonous delivery that fails to engage the viewer.", "clarity": "The message is muddled with unclear jargon and disorganized on-screen text, making it hard to follow.", "brand_fit": "The video attempts to mimic infomercial style but doesn't align well with typical engaging TikTok content.", "hook_strength": "The video starts with a vague statement that lacks a strong curiosity hook or immediate value promise."}	{"Introduce a strong, engaging hook in the first few seconds to capture attention.","Provide concrete examples or testimonials to add depth and credibility to the claims.","Simplify and clarify the message by reducing jargon and improving the organization of on-screen text.","Enhance pacing with varied shots and dynamic visuals to maintain viewer interest.","Include a clear, compelling call-to-action early in the video, highlighting a specific benefit or urgency."}	{"ocr_text": ["Advanced Bioactiv\\nStimulation TM\\nEnhanced penetration, gets to th\\ntry it\\n←\\nEnhanced Penetration\\nPantrating the Enidormie", "Advanced Bioactive\\nStimulation TM\\nEnhanced penetration, gets to the\\ntry it\\n←\\nBUT WHEN A\\nEnhanced Penetration\\nPantrating the Enidormie", "Advanced Bioactive\\nStimulation\\nTM\\nEnhanced penetration, gets to the\\ntry it →COMPANY EXPLAINS MORE\\nEnhanced Penetration\\nPantrating the Enidormie", "Advanced Bioacti\\nStimulation\\nTM\\nEnhanced penetration, gets to\\ntry it ->\\nTHAN YOUR PRIMARY\\nEnhanced Penetration\\nDentrating the Enidermie", "Advanced Bioactive (\\nStimulation TM\\nEnhanced penetration, gets to the ro\\ntry it\\nI'M SAT.\\nEnhanced Penetration\\nDantrating the Enidermie", "Promotes Growth\\nImproves blood circula\\nessential nutrients to s\\nfollicles.\\novide\\nse of hair\\nCOMPLETELY CHANGING HOW\\nStrengthens Hair\\nBy fortifying the hair structure, peptides can make\\nexisting hair healthier and more resilient, reducing\\nfurther hair loss.\\nbuy 2 get 1 free\\n8", "Promotes Growth\\nImproves blood circula\\nessential nutrients to s\\nfollicles.\\nSERUMS\\novide\\nse of hair\\nStrengthens Hair\\nBy fortifying the hair structure, peptides can make\\nexisting hair healthier and more resilient, reducing\\nfurther hair loss.\\nbuy 2 get 1 free\\n8", "THICKER HEALTHIER HAIR\\n3x bloom\\nhair+scalp serum\\n3-Month Supply Copper Peptide Serum\\nview product\\n$144\\nbuy 2 get 1 free\\n(128)", "GHK-Cu Copper Tripeptide\\nAHK-Ou Copper Tripeptide\\nPAL-AHK Copper Tripeptide\\nGHK Basic Tripeptide\\nother\\nZn-Thymulin Zinc Peptide\\nPTD-DBM Peptide\\nrepair\\nscalp health\\nAND EVEN BACKED", "Bioactive Stin ONE DROP AWAY\\nEnhancing Dermal Papilla Function\\nThe formula works to enhance the function of the\\ndermal papilla by providing essential nutrients and\\npromoting improved blood circulation to the hair\\nfollicle."], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_10.0s.jpg", "timestamp": 10}, {"filename": "frame_13.3s.jpg", "timestamp": 13.28333325}, {"filename": "frame_26.6s.jpg", "timestamp": 26.5666665}, {"filename": "frame_39.8s.jpg", "timestamp": 39.84999975}, {"filename": "frame_52.1s.jpg", "timestamp": 52.133333}], "transcript": "I'm sorry, but when a company explains more about your hair than your primary doctor can, I'm sad. Preventative care that's actually proactive. One company that's completely changing how you think about hair growth and topical hair serums. Triflur, a peptide scalp serum that uses next-gen peptides to strengthen and reactivate dormant hair follicles. Use their topical hair serum and see fuller, thicker, healthier hair in as quick as three to six months for most users. And pair it with their derma stamp and have accelerated results and even deeper penetration. Six peptides rooted in real data and science and even backed by Korean chemists. I don't know about you, but I trust anything that's Korean. And they just dropped this super cute comb. Healthier, fuller, and more radiant hair is literally one drop away."}	\N	\N	\N	2025-10-14 14:03:54.770545	2025-10-14 14:04:52.3934	\N
52	7559645780483525901	completed	2025-10-14 14:12:45.477	\N	1	whisper-1	google-vision	google-vision	gpt-4o	9f90084c47df5687	en	{"cta": 2, "depth": 2, "pacing": 4, "clarity": 3, "brand_fit": 3, "overall_100": 20, "hook_strength": 2}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "The CTA is vague and repetitive, lacking a compelling reason for viewers to take action.", "depth": "The video provides generic fashion advice without specific examples or actionable insights.", "pacing": "The pacing is consistent but lacks dynamics or engaging elements to maintain viewer interest.", "clarity": "The on-screen text is cluttered with typos and repetitive phrases, making it difficult to understand the core message.", "brand_fit": "The video doesn't align well with successful TikTok content due to lack of engaging visuals or trends.", "hook_strength": "The video starts without a clear hook, making it easy to scroll past without engagement."}	{"Introduce a compelling hook in the first 3 seconds to capture attention.","Provide specific fashion tips or demonstrate the advice with examples.","Correct typos and focus on delivering a clear, concise message.","Incorporate more dynamic cuts or transitions to enhance engagement.","Craft a more specific and urgent CTA to encourage viewer interaction."}	{"ocr_text": ["This is your sign to grab funky tights & miniskirts\\nFall Qaeifen is all about boots, layera & bold colors Thida year", "This is your aftan to grab funky tights & miniskirts\\nFall Fashion is all about boots, layers & bollectors this year", "This is your sign to grab funky tights & mini skirts\\nFall fashion is all about boots, layers & & bold colors this year", "This is your sign to grab funky tights & mini skirts\\nFall Fashion is all about boots, layers & beklectors this year", "This is your sign to grab funky tights & mini skirts\\nFall fashion is all about boots, layers & bell caters this year", "This is your eftgin to grab funky tights & mini skirts\\nGallTime:life is all abou\\nots, layers & bold aalara Vida year", "This is your sign to grab funky tights & mini skirts\\nFall fashion is all about boots, layers & bell caters this year", "This is your align to grab funky tights & mini skirts\\nFall Fashion is all about boots, layers & bollectors this year", "This is your sign to grab funky tit\\nGel Qineseifton is all about boots, layers & bald colera (Tiia Year"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_2.5s.jpg", "timestamp": 2.46666675}, {"filename": "frame_4.9s.jpg", "timestamp": 4.9333335}, {"filename": "frame_7.4s.jpg", "timestamp": 7.40000025}, {"filename": "frame_8.9s.jpg", "timestamp": 8.866667}], "transcript": "So everything she puts on, it just becomes cool right away. She just has this talent for anything she throws on an audience. It's cool."}	\N	\N	\N	2025-10-14 14:12:28.293481	2025-10-14 14:12:45.477795	\N
54	7559725318450334989	completed	2025-10-14 14:20:46.719	\N	1	whisper-1	google-vision	google-vision	gpt-4o	82e5ba387d4db2a9	en	{"cta": 0, "depth": 2, "pacing": 5, "clarity": 7, "brand_fit": 4, "overall_100": 32, "hook_strength": 3}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "There is no call-to-action included in the video, providing no direction for viewer engagement.", "depth": "The content is repetitive without delivering substantial information or deeper insights into the message.", "pacing": "The repetition of the same text creates a monotonous pacing, which might cause viewers to lose interest quickly.", "clarity": "The message about rejecting hustle culture is clear, but the repetition can lead to viewer disengagement.", "brand_fit": "The video lacks the dynamic, engaging elements typical of successful TikTok content and does not capitalize on platform trends.", "hook_strength": "The video starts immediately with repetitive on-screen text, lacking a strong visual or emotional hook."}	{"Introduce a visual or audio element in the first 3 seconds to better capture attention.","Incorporate diverse text or visuals to add depth and maintain viewer interest.","Include a compelling call-to-action, encouraging interaction or follow-up action.","Consider using trending formats or effects to better align with TikTok's style."}	{"ocr_text": ["Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack", "Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack", "Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack", "Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack", "Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack", "Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack", "Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack", "Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack", "Remember kings and queens, you\\ncan achieve your wildest creative\\ndreams going slow and resting\\noften. Hustle culture is wack"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_2.0s.jpg", "timestamp": 2.01666675}, {"filename": "frame_4.0s.jpg", "timestamp": 4.0333335}, {"filename": "frame_6.1s.jpg", "timestamp": 6.05000025}, {"filename": "frame_7.1s.jpg", "timestamp": 7.066667000000001}], "transcript": "."}	\N	\N	\N	2025-10-14 14:20:28.078248	2025-10-14 14:20:46.720243	\N
56	7559361360769961271	completed	2025-10-14 14:21:10.654	\N	1	whisper-1	google-vision	google-vision	gpt-4o	2dcb72f53863bbd5	en	{"cta": 4, "depth": 3, "pacing": 5, "clarity": 4, "brand_fit": 5, "overall_100": 42, "hook_strength": 5}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "CTA is present at the end but lacks specificity and urgency, simply suggests tapping 'Add to Cart'", "depth": "Information is repetitive and lacks depth, no actionable insights or unique points offered", "pacing": "Rhythm is monotonous due to repetitive text, lacks dynamic changes to maintain viewer interest", "clarity": "Multiple repetitions of the same message create confusion, lacks focus on a singular, clear point", "brand_fit": "Attempts a common product promotion style but feels disconnected from engaging TikTok trends", "hook_strength": "Begins with repeated statement about hair growth, lacks immediate engagement factor"}	{"Introduce a more compelling hook with a unique or surprising fact related to hair growth","Incorporate specific examples or testimonials to add depth and credibility to the information","Simplify and clarify the main message to avoid repetitive confusion; focus on a single takeaway","Vary visual elements and pacing to better engage viewers and sustain interest","Enhance CTA with a clear benefit and urgency to encourage immediate action"}	{"ocr_text": ["Did you know your hair can actually grow\\nfaster when it's fed the right nutrients? >", "Did you know your hair can actually grow\\nfaster when it's fed the right nutrients?", "Did you know your hair can actually grow\\nfaster when it's fed the right nutrients?", "Did you know your hair can actually grow\\nfaster when it's fed the right nutrients?", "Peptides help strengthen from the root\\nReal nutrients = real growth", "Did you know your hair can actually grow\\nfaster when it's fed the right nutrients?", "Peptides help strengthen from the root\\nReal nutrients = real growth\\nMolecular Support = Stronger Hair", "Bloom Peptide Hair Serum", "ma\\nBloom Peptide Hair Serum\\nTap \\"Add to Cart\\" and start your\\nhealthy hair journey today"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_10.0s.jpg", "timestamp": 10}, {"filename": "frame_4.3s.jpg", "timestamp": 4.30099775}, {"filename": "frame_8.6s.jpg", "timestamp": 8.6019955}, {"filename": "frame_12.9s.jpg", "timestamp": 12.902993249999998}, {"filename": "frame_16.2s.jpg", "timestamp": 16.203991}], "transcript": "She said take your time She said take your time So were missing our her new I'm not tired to turn you over Make you sing like la la blues Ah-ah, tell you show me"}	\N	\N	\N	2025-10-14 14:20:46.73922	2025-10-14 14:21:10.654478	\N
58	7560089166965394702	completed	2025-10-14 14:21:26.666	\N	1	whisper-1	google-vision	google-vision	gpt-4o	f89de3dbfab1a4b6	en	{"cta": 2, "depth": 1, "pacing": 3, "clarity": 6, "brand_fit": 3, "overall_100": 25, "hook_strength": 2}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "The call-to-action is vague and passive, relying solely on text to guide viewers to 'read the caption' without any compelling reason to do so.", "depth": "The video lacks depth entirely. It repeats an instruction to 'read the caption' without providing any in-video insights.", "pacing": "The pacing is flat and monotonous, with repetitive text and no changes in visuals or audio to maintain interest.", "clarity": "The message is somewhat clear in that it instructs viewers to 'read the caption,' but lacks further context or explanation.", "brand_fit": "The content feels out of place on TikTok, lacking the dynamic or engaging elements typical of successful videos on the platform.", "hook_strength": "The video does not have a strong hook, with only repetitive text and no engaging visual or audio elements to capture attention."}	{"Introduce an engaging visual or audio element within the first three seconds to strengthen the hook.","Include some basic information or tips directly in the video to add depth and value.","Incorporate varied visuals or text elements to improve pacing and maintain viewer interest.","Enhance the call-to-action with a specific reason or benefit for reading the caption.","Align content with TikTok trends by adding popular music, effects, or interactive elements."}	{"ocr_text": ["How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption", "How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption", "How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption", "How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption", "How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption", "How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption", "How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption", "How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption", "How to know if your shedding is\\nnormal or a sign of hair loss.\\nread the caption"], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_2.1s.jpg", "timestamp": 2.08349775}, {"filename": "frame_4.2s.jpg", "timestamp": 4.1669955}, {"filename": "frame_6.3s.jpg", "timestamp": 6.25049325}, {"filename": "frame_7.3s.jpg", "timestamp": 7.333990999999999}], "transcript": "Thanks for watching!"}	\N	\N	\N	2025-10-14 14:21:10.667346	2025-10-14 14:21:26.666798	\N
60	7559334475960765710	completed	2025-10-14 14:22:13.834	\N	1	whisper-1	google-vision	google-vision	gpt-4o	47ad1fbe83f87683	en	{"cta": 2, "depth": 4, "pacing": 4, "clarity": 4, "brand_fit": 3, "overall_100": 32, "hook_strength": 3}	{"composition": 7, "loopability": 6, "emotion_score": 8, "thumbstop_prob": 8, "motion_dynamics": 6, "text_legibility": 8, "text_timing_fit": 7, "trend_alignment": 8, "pattern_interrupt": 9, "visual_aesthetics": 8, "cultural_resonance": 7, "save_share_trigger": 7, "first_frame_strength": 7, "silent_comprehension": 6}	{"angle": "transformation", "hook_type": ["question", "curiosity"], "shot_types": ["wide", "close_up"], "emotion_tags": ["awe", "serenity"], "content_types": ["demo", "story"], "visual_subjects": ["architecture", "cathedral"], "composition_tags": ["symmetry", "leading_lines"], "pattern_interrupt": ["grand_scale", "color_contrast"]}	{"cta": "The call-to-action is barely noticeable and lacks compelling language to drive viewer engagement or action.", "depth": "The content provides a basic insight about hair care but lacks depth, examples, or evidence to support claims.", "pacing": "The pacing is monotonous with no dynamic changes, making it difficult to maintain viewer interest throughout the 17 seconds.", "clarity": "The message is muddled due to repetitive text and unclear voiceover, leading to confusion about the main point.", "brand_fit": "The video does not align well with typical TikTok content; it feels more like an infomercial and lacks TikTok-native elements like trends or engaging visuals.", "hook_strength": "The video starts with an unclear message and repetitive text, failing to create a strong initial hook."}	{"Introduce a clear, engaging hook in the first few seconds to capture attention.","Incorporate visual examples or testimonials to enhance the depth and credibility of the information.","Clarify the on-screen text and voiceover to ensure a coherent message is delivered.","Add dynamic pacing elements such as varied shot angles or quick edits to maintain interest.","Strengthen the CTA with specific benefits and a sense of urgency to encourage viewer interaction.","Adapt content to better fit TikTok trends and storytelling styles to improve platform alignment."}	{"ocr_text": ["Did you know that your hair can't truly\\nthrive without being nourished from the\\nroots?", "Did you know that your hair can't truly\\nthrive without being nourished from the\\nroots?", "Did you know that your hair can't truly\\nthrive without being nourished from the\\nroots?", "Did you know that your hair can't truly\\nthrive without being nourished from the\\nroots? F", "Most hair products only maske\\nmago on the surface, but\\nyour scalp and strands craver al nutrients. Our peptide-\\nrich hair serum delivers essential proteins that help\\nstrengthen, restore, and fuel natural hair growth from\\nwithina.", "Most hair products only mask damago on the surface, but\\nyour scalp and strands crave real nutrients. Our peptide-\\nrich hair serum delivers essential proteins that help\\nstrengthen, restore, and fuel natural hair growth from\\nwithin.", "Most hair products only mask dama Jo on the surface, but\\nyour scalp and strands crave real nutrients. Our peptide-\\nrict fair serum delivers essential proteins that help\\nstrengthen, restore, and fuel natural hair growth from\\nwithina.", "With consistent use, you'll notice thicker, healthier, more\\nresilient hair because growth starts at the source.", "With consistent use, you'll notic thicker, healthier, more\\nresilient hair because growth starts at the source. +\\nShop Bloom Peptide Klair Serum."], "keyframes": [{"filename": "frame_0.0s.jpg", "timestamp": 0}, {"filename": "frame_1.0s.jpg", "timestamp": 1}, {"filename": "frame_2.0s.jpg", "timestamp": 2}, {"filename": "frame_3.0s.jpg", "timestamp": 3}, {"filename": "frame_5.0s.jpg", "timestamp": 5}, {"filename": "frame_10.0s.jpg", "timestamp": 10}, {"filename": "frame_4.2s.jpg", "timestamp": 4.24166675}, {"filename": "frame_8.5s.jpg", "timestamp": 8.4833335}, {"filename": "frame_12.7s.jpg", "timestamp": 12.72500025}, {"filename": "frame_16.0s.jpg", "timestamp": 15.966667000000001}], "transcript": "is just not care. and not for anyone else, dress the way you want to dress,"}	\N	\N	\N	2025-10-14 14:21:48.822604	2025-10-14 14:22:13.834688	\N
\.


--
-- Data for Name: video_snapshots; Type: TABLE DATA; Schema: public; Owner: tiktok_user
--

COPY public.video_snapshots (id, video_id, user_id, snapshot_date, view_count, like_count, comment_count, share_count, created_at) FROM stdin;
1	7548583132778351886	8	2025-10-13	352	7	1	1	2025-10-14 15:16:25.442171
2	7556278981167713591	8	2025-10-13	120	4	0	0	2025-10-14 15:16:25.442171
3	7551150667700686135	8	2025-10-13	307	4	1	0	2025-10-14 15:16:25.442171
4	7548148907767827767	8	2025-10-13	450	12	3	2	2025-10-14 15:16:25.442171
5	7558181865178352910	8	2025-10-13	325	9	1	0	2025-10-14 15:16:25.442171
6	7537356115898682679	8	2025-10-13	1346	13	0	1	2025-10-14 15:16:25.442171
7	7517569526372781367	8	2025-10-13	305	3	0	0	2025-10-14 15:16:25.442171
8	7559725318450334989	8	2025-10-13	340	41	3	1	2025-10-14 15:16:25.442171
9	7559645780483525901	8	2025-10-13	355	21	6	0	2025-10-14 15:16:25.442171
10	7559334475960765710	8	2025-10-13	307	8	4	0	2025-10-14 15:16:25.442171
11	7558168355031534861	8	2025-10-13	315	11	1	1	2025-10-14 15:16:25.442171
12	7482867503169883434	8	2025-10-13	82	2	0	0	2025-10-14 15:16:25.442171
13	7559361360769961271	8	2025-10-13	320	7	1	0	2025-10-14 15:16:25.442171
14	7463868346467945771	8	2025-10-13	182	4	0	0	2025-10-14 15:16:25.442171
15	7558252577226296631	8	2025-10-13	339	5	0	1	2025-10-14 15:16:25.442171
16	7558975027060755725	8	2025-10-13	317	4	0	1	2025-10-14 15:16:25.442171
17	7558932757750107405	8	2025-10-13	366	6	1	1	2025-10-14 15:16:25.442171
18	7558558772197674254	8	2025-10-13	340	5	3	2	2025-10-14 15:16:25.442171
19	7549308516113190199	8	2025-10-13	325	20	1	0	2025-10-14 15:16:25.442171
20	7558621254396169486	8	2025-10-13	351	7	1	2	2025-10-14 15:16:25.442171
21	7556406691391081783	8	2025-10-13	292	7	0	0	2025-10-14 15:16:25.442171
22	7556404122157714702	8	2025-10-13	286	5	0	0	2025-10-14 15:16:25.442171
23	7557483545636179214	8	2025-10-13	348	8	1	1	2025-10-14 15:16:25.442171
24	7557121483772824846	8	2025-10-13	308	5	3	0	2025-10-14 15:16:25.442171
25	7556703323974405389	8	2025-10-13	326	7	1	1	2025-10-14 15:16:25.442171
26	7556701345093258551	8	2025-10-13	127	7	1	0	2025-10-14 15:16:25.442171
27	7554538108235025677	8	2025-10-13	368	7	0	0	2025-10-14 15:16:25.442171
28	7556034792219856183	8	2025-10-13	303	8	2	3	2025-10-14 15:16:25.442171
29	7555653534167960887	8	2025-10-13	458	7	0	0	2025-10-14 15:16:25.442171
30	7555617398137638158	8	2025-10-13	319	6	1	1	2025-10-14 15:16:25.442171
31	7554893586144251150	8	2025-10-13	376	52	2	7	2025-10-14 15:16:25.442171
32	7554825054798744845	8	2025-10-13	375	19	7	7	2025-10-14 15:16:25.442171
33	7554493545084734733	8	2025-10-13	144	7	1	0	2025-10-14 15:16:25.442171
34	7551219292017020215	8	2025-10-13	348	6	1	1	2025-10-14 15:16:25.442171
35	7554112336412413214	8	2025-10-13	349	13	1	0	2025-10-14 15:16:25.442171
36	7553768954745900302	8	2025-10-13	404	10	1	0	2025-10-14 15:16:25.442171
37	7553455030058192183	8	2025-10-13	146	7	1	0	2025-10-14 15:16:25.442171
38	7553047185349299470	8	2025-10-13	603	15	1	1	2025-10-14 15:16:25.442171
39	7553021746182507789	8	2025-10-13	325	23	1	0	2025-10-14 15:16:25.442171
40	7551827540504038670	8	2025-10-13	296	5	0	0	2025-10-14 15:16:25.442171
41	7549550228731399479	8	2025-10-13	346	6	1	0	2025-10-14 15:16:25.442171
42	7554499031154691341	8	2025-10-13	366	4	1	0	2025-10-14 15:16:25.442171
43	7551193454500400398	8	2025-10-13	435	7	0	0	2025-10-14 15:16:25.442171
44	7550383030712487181	8	2025-10-13	302	6	0	0	2025-10-14 15:16:25.442171
45	7549733803644685599	8	2025-10-13	351	6	1	0	2025-10-14 15:16:25.442171
46	7549553521398484237	8	2025-10-13	364	6	3	2	2025-10-14 15:16:25.442171
47	7547830075463437581	8	2025-10-13	900	12	1	6	2025-10-14 15:16:25.442171
48	7560820578072923406	8	2025-10-13	269	3	1	0	2025-10-14 15:16:25.442171
49	7550710162248568077	8	2025-10-13	313	8	1	0	2025-10-14 15:16:25.442171
50	7548871552876514573	8	2025-10-13	361	19	1	1	2025-10-14 15:16:25.442171
51	7548971835933723959	8	2025-10-13	361	39	3	2	2025-10-14 15:16:25.442171
52	7548633603450653966	8	2025-10-13	310	4	1	1	2025-10-14 15:16:25.442171
53	7546647113313078542	8	2025-10-13	1006	17	4	2	2025-10-14 15:16:25.442171
54	7537907137381403959	8	2025-10-13	425	7	1	0	2025-10-14 15:16:25.442171
55	7546578329659280653	8	2025-10-13	1356	22	2	3	2025-10-14 15:16:25.442171
56	7546021961529445645	8	2025-10-13	289	5	3	0	2025-10-14 15:16:25.442171
57	7537932450962394382	8	2025-10-13	203	3	0	0	2025-10-14 15:16:25.442171
58	7520269234409098551	8	2025-10-13	988	16	5	0	2025-10-14 15:16:25.442171
59	7520055899340262711	8	2025-10-13	412	7	2	0	2025-10-14 15:16:25.442171
60	7492901348850109738	8	2025-10-13	185	11	0	0	2025-10-14 15:16:25.442171
61	7492874106480725290	8	2025-10-13	214	12	0	0	2025-10-14 15:16:25.442171
62	7560427315214159117	8	2025-10-13	299	9	0	0	2025-10-14 15:16:25.442171
63	7517563988461342007	8	2025-10-13	526	3	4	0	2025-10-14 15:16:25.442171
64	7493309270025473326	8	2025-10-13	128	11	2	1	2025-10-14 15:16:25.442171
65	7492941004627103018	8	2025-10-13	234	12	17	6	2025-10-14 15:16:25.442171
66	7496984316115782954	8	2025-10-13	123	11	0	0	2025-10-14 15:16:25.442171
67	7491065525284441386	8	2025-10-13	129	3	0	0	2025-10-14 15:16:25.442171
68	7492567544130293034	8	2025-10-13	211	4	0	0	2025-10-14 15:16:25.442171
69	7492304679309987118	8	2025-10-13	1305	13	3	0	2025-10-14 15:16:25.442171
70	7491869397254950186	8	2025-10-13	251	5	1	0	2025-10-14 15:16:25.442171
71	7491526828205591850	8	2025-10-13	166	7	1	0	2025-10-14 15:16:25.442171
72	7490402644494667050	8	2025-10-13	156	2	4	0	2025-10-14 15:16:25.442171
73	7491117459035147566	8	2025-10-13	3913	17	0	1	2025-10-14 15:16:25.442171
74	7464254395975355690	8	2025-10-13	145	3	0	0	2025-10-14 15:16:25.442171
75	7560089166965394702	8	2025-10-13	304	4	1	0	2025-10-14 15:16:25.442171
76	7481364881225141546	8	2025-10-13	283	5	0	1	2025-10-14 15:16:25.442171
77	7481036628551617838	8	2025-10-13	144	2	0	0	2025-10-14 15:16:25.442171
78	7480708468903660843	8	2025-10-13	2666	162	0	1	2025-10-14 15:16:25.442171
79	7471068513638321454	8	2025-10-13	63	3	2	1	2025-10-14 15:16:25.442171
80	7450987571980537134	8	2025-10-13	235	8	2	9	2025-10-14 15:16:25.442171
81	7553402943257578765	8	2025-10-13	422	6	1	0	2025-10-14 15:16:25.442171
82	7463547304709147950	8	2025-10-13	129	3	0	0	2025-10-14 15:16:25.442171
83	7463174221653396782	8	2025-10-13	528	3	0	0	2025-10-14 15:16:25.442171
84	7458124564732726571	8	2025-10-13	416	9	0	1	2025-10-14 15:16:25.442171
85	7451367909923802411	8	2025-10-13	1638	14	0	0	2025-10-14 15:16:25.442171
86	7451177065581120811	8	2025-10-13	187	7	0	1	2025-10-14 15:16:25.442171
87	7458119197915221290	8	2025-10-13	163	7	0	0	2025-10-14 15:16:25.442171
88	7447594977946963246	8	2025-10-13	127	5	2	2	2025-10-14 15:16:25.442171
89	7447291125293157678	8	2025-10-13	878	9	3	10	2025-10-14 15:16:25.442171
90	7444433503699111210	8	2025-10-13	268	3	0	0	2025-10-14 15:16:25.442171
91	7449187181978979630	8	2025-10-13	148	3	0	1	2025-10-14 15:16:25.442171
92	7449125544135871787	8	2025-10-13	223	4	1	2	2025-10-14 15:16:25.442171
93	7448850234651872558	8	2025-10-13	194	4	1	0	2025-10-14 15:16:25.442171
94	7446594232124673326	8	2025-10-13	518	2	0	1	2025-10-14 15:16:25.442171
95	7444427381688831274	8	2025-10-13	264	3	0	0	2025-10-14 15:16:25.442171
96	7558985563248823607	8	2025-10-13	338	5	0	1	2025-10-14 15:16:25.442171
97	7557522530441923854	8	2025-10-13	358	5	1	0	2025-10-14 15:16:25.442171
98	7554174500896541965	8	2025-10-13	358	5	0	0	2025-10-14 15:16:25.442171
99	7551520199334235447	8	2025-10-13	376	5	3	2	2025-10-14 15:16:25.442171
100	7549253781486112014	8	2025-10-13	298	5	1	0	2025-10-14 15:16:25.442171
101	7549182471049334029	8	2025-10-13	394	23	3	0	2025-10-14 15:16:25.442171
102	7517574206784146743	8	2025-10-13	1708	16	0	1	2025-10-14 15:16:25.442171
103	7492704865827835179	8	2025-10-13	301	10	0	0	2025-10-14 15:16:25.442171
104	7491129211466403115	8	2025-10-13	285	6	0	0	2025-10-14 15:16:25.442171
105	7489523638685732139	8	2025-10-13	413	6	0	0	2025-10-14 15:16:25.442171
106	7482495636198198570	8	2025-10-13	175	2	0	0	2025-10-14 15:16:25.442171
107	7450056466565827882	8	2025-10-13	157	6	0	2	2025-10-14 15:16:25.442171
108	7550331433114520887	8	2025-10-13	202	7	3	0	2025-10-14 15:16:25.442171
109	7459521915577814318	8	2025-10-13	490	18	0	0	2025-10-14 15:16:25.442171
110	7450326629714496814	8	2025-10-13	587	8	0	1	2025-10-14 15:16:25.442171
111	7444426970118589738	8	2025-10-13	297	3	0	1	2025-10-14 15:16:25.442171
112	7548532157291957518	8	2025-10-13	162	5	3	1	2025-10-14 15:16:25.442171
113	7548583132778351886	8	2025-10-14	352	7	1	1	2025-10-14 15:23:22.961293
114	7556278981167713591	8	2025-10-14	120	4	0	0	2025-10-14 15:23:22.961293
115	7551150667700686135	8	2025-10-14	307	4	1	0	2025-10-14 15:23:22.961293
116	7548148907767827767	8	2025-10-14	450	12	3	2	2025-10-14 15:23:22.961293
117	7558181865178352910	8	2025-10-14	325	9	1	0	2025-10-14 15:23:22.961293
118	7537356115898682679	8	2025-10-14	1346	13	0	1	2025-10-14 15:23:22.961293
119	7517569526372781367	8	2025-10-14	305	3	0	0	2025-10-14 15:23:22.961293
120	7559725318450334989	8	2025-10-14	340	41	3	1	2025-10-14 15:23:22.961293
121	7559645780483525901	8	2025-10-14	355	21	6	0	2025-10-14 15:23:22.961293
122	7559334475960765710	8	2025-10-14	307	8	4	0	2025-10-14 15:23:22.961293
123	7558168355031534861	8	2025-10-14	315	11	1	1	2025-10-14 15:23:22.961293
124	7482867503169883434	8	2025-10-14	82	2	0	0	2025-10-14 15:23:22.961293
125	7559361360769961271	8	2025-10-14	320	7	1	0	2025-10-14 15:23:22.961293
126	7463868346467945771	8	2025-10-14	182	4	0	0	2025-10-14 15:23:22.961293
127	7558252577226296631	8	2025-10-14	339	5	0	1	2025-10-14 15:23:22.961293
128	7558975027060755725	8	2025-10-14	317	4	0	1	2025-10-14 15:23:22.961293
129	7558932757750107405	8	2025-10-14	366	6	1	1	2025-10-14 15:23:22.961293
130	7558558772197674254	8	2025-10-14	340	5	3	2	2025-10-14 15:23:22.961293
131	7549308516113190199	8	2025-10-14	325	20	1	0	2025-10-14 15:23:22.961293
132	7558621254396169486	8	2025-10-14	351	7	1	2	2025-10-14 15:23:22.961293
133	7556406691391081783	8	2025-10-14	292	7	0	0	2025-10-14 15:23:22.961293
134	7556404122157714702	8	2025-10-14	286	5	0	0	2025-10-14 15:23:22.961293
135	7557483545636179214	8	2025-10-14	348	8	1	1	2025-10-14 15:23:22.961293
136	7557121483772824846	8	2025-10-14	308	5	3	0	2025-10-14 15:23:22.961293
137	7556703323974405389	8	2025-10-14	326	7	1	1	2025-10-14 15:23:22.961293
138	7556701345093258551	8	2025-10-14	127	7	1	0	2025-10-14 15:23:22.961293
139	7554538108235025677	8	2025-10-14	368	7	0	0	2025-10-14 15:23:22.961293
140	7556034792219856183	8	2025-10-14	303	8	2	3	2025-10-14 15:23:22.961293
141	7555653534167960887	8	2025-10-14	458	7	0	0	2025-10-14 15:23:22.961293
142	7555617398137638158	8	2025-10-14	319	6	1	1	2025-10-14 15:23:22.961293
143	7554893586144251150	8	2025-10-14	376	52	2	7	2025-10-14 15:23:22.961293
144	7554825054798744845	8	2025-10-14	375	19	7	7	2025-10-14 15:23:22.961293
145	7554493545084734733	8	2025-10-14	144	7	1	0	2025-10-14 15:23:22.961293
146	7551219292017020215	8	2025-10-14	348	6	1	1	2025-10-14 15:23:22.961293
147	7554112336412413214	8	2025-10-14	349	13	1	0	2025-10-14 15:23:22.961293
148	7553768954745900302	8	2025-10-14	404	10	1	0	2025-10-14 15:23:22.961293
149	7553455030058192183	8	2025-10-14	146	7	1	0	2025-10-14 15:23:22.961293
150	7553047185349299470	8	2025-10-14	603	15	1	1	2025-10-14 15:23:22.961293
151	7553021746182507789	8	2025-10-14	325	23	1	0	2025-10-14 15:23:22.961293
152	7551827540504038670	8	2025-10-14	296	5	0	0	2025-10-14 15:23:22.961293
153	7549550228731399479	8	2025-10-14	346	6	1	0	2025-10-14 15:23:22.961293
154	7554499031154691341	8	2025-10-14	366	4	1	0	2025-10-14 15:23:22.961293
155	7551193454500400398	8	2025-10-14	435	7	0	0	2025-10-14 15:23:22.961293
156	7550383030712487181	8	2025-10-14	302	6	0	0	2025-10-14 15:23:22.961293
157	7549733803644685599	8	2025-10-14	351	6	1	0	2025-10-14 15:23:22.961293
158	7549553521398484237	8	2025-10-14	364	6	3	2	2025-10-14 15:23:22.961293
159	7547830075463437581	8	2025-10-14	900	12	1	6	2025-10-14 15:23:22.961293
160	7560820578072923406	8	2025-10-14	269	3	1	0	2025-10-14 15:23:22.961293
161	7550710162248568077	8	2025-10-14	313	8	1	0	2025-10-14 15:23:22.961293
162	7548871552876514573	8	2025-10-14	361	19	1	1	2025-10-14 15:23:22.961293
163	7548971835933723959	8	2025-10-14	361	39	3	2	2025-10-14 15:23:22.961293
164	7548633603450653966	8	2025-10-14	310	4	1	1	2025-10-14 15:23:22.961293
165	7546647113313078542	8	2025-10-14	1006	17	4	2	2025-10-14 15:23:22.961293
166	7537907137381403959	8	2025-10-14	425	7	1	0	2025-10-14 15:23:22.961293
167	7546578329659280653	8	2025-10-14	1356	22	2	3	2025-10-14 15:23:22.961293
168	7546021961529445645	8	2025-10-14	289	5	3	0	2025-10-14 15:23:22.961293
169	7537932450962394382	8	2025-10-14	203	3	0	0	2025-10-14 15:23:22.961293
170	7520269234409098551	8	2025-10-14	988	16	5	0	2025-10-14 15:23:22.961293
171	7520055899340262711	8	2025-10-14	412	7	2	0	2025-10-14 15:23:22.961293
172	7492901348850109738	8	2025-10-14	185	11	0	0	2025-10-14 15:23:22.961293
173	7492874106480725290	8	2025-10-14	214	12	0	0	2025-10-14 15:23:22.961293
174	7560427315214159117	8	2025-10-14	299	9	0	0	2025-10-14 15:23:22.961293
175	7517563988461342007	8	2025-10-14	526	3	4	0	2025-10-14 15:23:22.961293
176	7493309270025473326	8	2025-10-14	128	11	2	1	2025-10-14 15:23:22.961293
177	7492941004627103018	8	2025-10-14	234	12	17	6	2025-10-14 15:23:22.961293
178	7496984316115782954	8	2025-10-14	123	11	0	0	2025-10-14 15:23:22.961293
179	7491065525284441386	8	2025-10-14	129	3	0	0	2025-10-14 15:23:22.961293
180	7492567544130293034	8	2025-10-14	211	4	0	0	2025-10-14 15:23:22.961293
181	7492304679309987118	8	2025-10-14	1305	13	3	0	2025-10-14 15:23:22.961293
182	7491869397254950186	8	2025-10-14	251	5	1	0	2025-10-14 15:23:22.961293
183	7491526828205591850	8	2025-10-14	166	7	1	0	2025-10-14 15:23:22.961293
184	7490402644494667050	8	2025-10-14	156	2	4	0	2025-10-14 15:23:22.961293
185	7491117459035147566	8	2025-10-14	3913	17	0	1	2025-10-14 15:23:22.961293
186	7464254395975355690	8	2025-10-14	145	3	0	0	2025-10-14 15:23:22.961293
187	7560089166965394702	8	2025-10-14	304	4	1	0	2025-10-14 15:23:22.961293
188	7481364881225141546	8	2025-10-14	283	5	0	1	2025-10-14 15:23:22.961293
189	7481036628551617838	8	2025-10-14	144	2	0	0	2025-10-14 15:23:22.961293
190	7480708468903660843	8	2025-10-14	2666	162	0	1	2025-10-14 15:23:22.961293
191	7471068513638321454	8	2025-10-14	63	3	2	1	2025-10-14 15:23:22.961293
192	7450987571980537134	8	2025-10-14	235	8	2	9	2025-10-14 15:23:22.961293
193	7553402943257578765	8	2025-10-14	422	6	1	0	2025-10-14 15:23:22.961293
194	7463547304709147950	8	2025-10-14	129	3	0	0	2025-10-14 15:23:22.961293
195	7463174221653396782	8	2025-10-14	528	3	0	0	2025-10-14 15:23:22.961293
196	7458124564732726571	8	2025-10-14	416	9	0	1	2025-10-14 15:23:22.961293
197	7451367909923802411	8	2025-10-14	1638	14	0	0	2025-10-14 15:23:22.961293
198	7451177065581120811	8	2025-10-14	187	7	0	1	2025-10-14 15:23:22.961293
199	7458119197915221290	8	2025-10-14	163	7	0	0	2025-10-14 15:23:22.961293
200	7447594977946963246	8	2025-10-14	127	5	2	2	2025-10-14 15:23:22.961293
201	7447291125293157678	8	2025-10-14	878	9	3	10	2025-10-14 15:23:22.961293
202	7444433503699111210	8	2025-10-14	268	3	0	0	2025-10-14 15:23:22.961293
203	7449187181978979630	8	2025-10-14	148	3	0	1	2025-10-14 15:23:22.961293
204	7449125544135871787	8	2025-10-14	223	4	1	2	2025-10-14 15:23:22.961293
205	7448850234651872558	8	2025-10-14	194	4	1	0	2025-10-14 15:23:22.961293
206	7446594232124673326	8	2025-10-14	518	2	0	1	2025-10-14 15:23:22.961293
207	7444427381688831274	8	2025-10-14	264	3	0	0	2025-10-14 15:23:22.961293
208	7558985563248823607	8	2025-10-14	338	5	0	1	2025-10-14 15:23:22.961293
209	7557522530441923854	8	2025-10-14	358	5	1	0	2025-10-14 15:23:22.961293
210	7554174500896541965	8	2025-10-14	358	5	0	0	2025-10-14 15:23:22.961293
211	7551520199334235447	8	2025-10-14	376	5	3	2	2025-10-14 15:23:22.961293
212	7549253781486112014	8	2025-10-14	298	5	1	0	2025-10-14 15:23:22.961293
213	7549182471049334029	8	2025-10-14	394	23	3	0	2025-10-14 15:23:22.961293
214	7517574206784146743	8	2025-10-14	1708	16	0	1	2025-10-14 15:23:22.961293
215	7492704865827835179	8	2025-10-14	301	10	0	0	2025-10-14 15:23:22.961293
216	7491129211466403115	8	2025-10-14	285	6	0	0	2025-10-14 15:23:22.961293
217	7489523638685732139	8	2025-10-14	413	6	0	0	2025-10-14 15:23:22.961293
218	7482495636198198570	8	2025-10-14	175	2	0	0	2025-10-14 15:23:22.961293
219	7450056466565827882	8	2025-10-14	157	6	0	2	2025-10-14 15:23:22.961293
220	7550331433114520887	8	2025-10-14	202	7	3	0	2025-10-14 15:23:22.961293
221	7459521915577814318	8	2025-10-14	490	18	0	0	2025-10-14 15:23:22.961293
222	7450326629714496814	8	2025-10-14	587	8	0	1	2025-10-14 15:23:22.961293
223	7444426970118589738	8	2025-10-14	297	3	0	1	2025-10-14 15:23:22.961293
224	7548532157291957518	8	2025-10-14	162	5	3	1	2025-10-14 15:23:22.961293
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: tiktok_user
--

COPY public.videos (id, username, caption, video_description, hashtags, posted_at_iso, create_time, duration, view_count, like_count, comment_count, share_count, engagement_rate, like_rate, comment_rate, share_rate, views_24h, velocity_24h, share_url, embed_link, cover_image_url, video_title, author_username, author_nickname, author_avatar_url, music_title, music_artist, is_adhoc, created_at, updated_at, user_id) FROM stdin;
7548583132778351886	tryfleur	\N	Turn your nightly self-care into a ritual that feels truly indulgent ✨  With Bloom Peptide Hair Serum, every evening becomes a moment of intention. As you wind down, let GHK-Cu and our blend of advanced peptides nourish your scalp and strands, supporting the look of healthier, fuller-feeling hair.  Light, water-based, and crafted for your aesthetic vanity, it transforms your nighttime routine into a virtual retreat, a quiet, fulfilling pause that leaves you feeling nurtured, grounded, and connected to yourself 🤎🧬  #peptide #hairtok #ghkcu #peptidetherapy #peptideserum 	\N	2025-09-10 21:58:29	1757541509	6	352	7	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7548583132778351886?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o0eBGeAFjII7RvOs9FBXdTkQIfMB9bAIDA8vIf~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=05e8bff4&x-expires=1760533200&x-signature=JQXkk5L2BrVbSM7mTMlrUvExF3c%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.432549	2025-10-14 13:21:56.97277	8
7556278981167713591	tryfleur	\N	Bloom works beneath the surface, delivering powerful nutrients that restore, strengthen, and transform your hair into a fuller, healthier version of itself. Bloom peptide hair serum is a water-based, multi-peptide serum designed for daily, not drastic care-light texture, zero residue, and made to absorb into the scalp (not coat the hair). 🤎 Peptides like GHK-Cu, AHK-Cu, PAL-AHK, GHK, Zn-Thymulin, and PTD-DBM help support a healthier follicle environment by signaling cellular repair pathways and balancing the scalp micro-ecosystem. Because the formula is water-based, it absorbs quickly without the occlusive film oils can leave, so it layers cleanly under your normal routine. Use 3-5 small drops on the scalp and massage for 30-60 seconds. Consistency matters more than quantity. A temporary uptick in shedding can occur in the first few weeks as older hairs cycle out; most people notice stronger, fuller-looking strands with steady use over 3-6 months. Have questions about routines or ingredients? Drop them below. 💧✨ Shop directly through TikTok.  #hairgrowthtips #peptideserum #serum #tiktokshopfinds #ghkcuforhairgrowth 	\N	2025-10-01 15:42:37	1759333357	0	120	4	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7556278981167713591?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/cab40195a57843678ee8c97d8e49be9a~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=c41b8d1b&x-expires=1761742800&x-signature=gHi3Z8rhPqrkJP9YeyUvpGL3zyw%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&biz_tag=tt_photomode&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.40594	2025-10-14 13:21:56.944769	8
7551150667700686135	tryfleur	\N	Shop Bloom Now 🌸🧸 🤎 Helps repair and protect thinning hair at the root 🤎 Supports visibly fuller, denser strands with consistent use 🤎 Powered by GHK-Cu peptides for real growth results 🤎 Doubles as a scalp + hair care serum for daily ritual 🤎 Formulated with clean, science-backed ingredients that honor your hair’s natural balance 🤎 Vegan & Cruelty Free  🤎 Lightweight water based formula leaves your hair feel hydrated but not oily.  We could go on and on, but you won’t understand till you try our product yourself! Shop our TikTok shop today. 🌸✨ #ghkcu #peptide #hairtok #haircareserums #multipeptideserum 	\N	2025-09-17 20:01:43	1758139303	8	307	4	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7551150667700686135?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oUBPM0KaATiEpkC2BmIW6g6jmI0UiN0C4LEsi~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=14f02dbd&x-expires=1760533200&x-signature=VD4CIciySJ9CIFcVCvDDkl8m%2B%2Bw%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.421195	2025-10-14 13:21:56.962721	8
7548148907767827767	tryfleur	\N	Bloom Peptide Hair Serum: Real hair care starts at the root, this is hair science in a bottle with GHK-Cu peptides and a blend of five other powerful peptides. Your skin barrier is like a fortress 🧱 built to protect and keep things out, to truly reach the follicle you need something small, agile, and clever enough to slip past the gatekeepers. That is where peptides come in 🧬 these ultra tiny messengers are like keys unlocking the pathway to your scalp’s foundation. Once they reach the hair bulb, your very own hair factory, they send signals that say let’s nurture, let’s energize, let’s bring life back. Each peptide plays a different part, together they create a symphony designed to support stronger, fuller looking, more resilient strands. Peptide are more than just science, peptides are your hair’s best ally 🤎. ##ghkcu##peptide##scalpcare##hairtok##peptidetherapy	\N	2025-09-09 17:53:43	1757440423	0	450	12	3	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7548148907767827767?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/212a503b00b1402c92663b5982dab8e4~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=4b2e9dab&x-expires=1761742800&x-signature=6DRzshcrKXM9m0lFQ7nY9G8BWoc%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&biz_tag=tt_photomode&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.434384	2025-10-14 13:21:56.974389	8
7558181865178352910	tryfleur	\N	#hairtok #curlyhair #howtogrowcurlyhairquick #peptidehairserum #bloompeptidehairserum 	\N	2025-10-06 18:46:37	1759776397	147	325	9	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7558181865178352910?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMPkLMa8J4g1E4UAbQPWnWDBwiaAOBoiIE50U~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=f8eedf93&x-expires=1760533200&x-signature=kDGwnVzz6fZ7obv7obGWY%2FUScOQ%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.398961	2025-10-14 13:21:56.934894	8
7537356115898682679	tryfleur	\N	My secret for long, thick hair 👀 It’s not oil. It’s not rice water. It’s peptides. Peptides like GHK-Cu, AHK-Cu, and PTD-DBM work at the root—literally. They signal your follicles to stay in the growth phase longer, help repair damage, and make each strand stronger from the inside out. That’s why I use Bloom Peptide Hair Serum—it feeds your hair exactly what it needs to grow thicker, healthier, and faster than you thought possible. #PeptideHairCare #HairGrowthTips #HealthyHairSecrets #BloomHairSerum #ThickerHair #GHKCU #PeptidesForHair #HairCareRoutine #HairLossSolution #LongHairJourney #HairTok #BeautyTok	\N	2025-08-11 15:52:15	1754927535	9	1346	13	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7537356115898682679?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMIIaoREpBhs3gRNnfIAGFEDFEDaXmBAAfyBbS~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=1b6f0f62&x-expires=1760533200&x-signature=7oUyXMvKvVW%2FuYOOpASD23yl%2FKU%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.440566	2025-10-14 13:21:56.981094	8
7517569526372781367	tryfleur	\N	Peptides, especially copper tri-peptides, were only ever available to the rich, but due to mass production they’re now affordable. Take GHK-cu for example, a leading hair regrowth peptide. Less than 10 years ago it cost more than $1,000 per gram, it’s now $35 per gram. The same for some of the other leading peptides in our hair growth serum like AHK-cu, Pal-Ahk, and even GHK basic. Some are still expensive, like our PTD-BPM which is $90 per gram, but the point is that they’re now affordable enough to be packaged and sold at a feasible price. Peptides are revolutionizing both skin and hair care, because they’re small enough to penetrate the skin barrier, and they, like all the other peptides in your body, are made of from amino acids which your body uses to carry out hundreds if not thousands of functions per day. If you haven’t tried a peptide based product, take some time to research them, it’ll be well worth your time :) #copperpeptides #peptides #hairserum #hairtok #hairgrowth 	\N	2025-06-19 08:10:33	1750320633	118	305	3	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7517569526372781367?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oIjCvLHvBzpeiypxfQrqAWkn22QIQbSMG4ieIA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=efc04bbf&x-expires=1760533200&x-signature=toGr%2FfxMkcLYzKW%2FtH9dmAdcL7E%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.444174	2025-10-14 13:21:56.984636	8
7559725318450334989	tryfleur	\N	Your greatest ideas come from peace not burn out. 	\N	2025-10-10 22:35:43	1760135743	8	340	41	3	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7559725318450334989?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oI40BaTsKAP4CIDxwIiwdipBgfUpSkMiBCA3pI~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=b11bf4aa&x-expires=1760533200&x-signature=Mt4tfsIbwM87B232aIIzqWjv9Wc%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.391318	2025-10-14 13:21:56.925952	8
7559645780483525901	tryfleur	\N	Mini skirts aren’t just for summer 😍 Style them with funky tights & boots all fall long 🍁 #fallfashion #cozyaesthetic #pintrest #falloutfits #coloredtights 	\N	2025-10-10 17:27:08	1760117228	9	355	21	6	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7559645780483525901?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o0V5fjFoQE2O4UdHngRISDeC0QLUkVEfAAvFHj~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=0ce377b7&x-expires=1760533200&x-signature=ApiW5pXGU6nl%2B8z16P8sMpCIyVg%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.392108	2025-10-14 13:21:56.926831	8
7559334475960765710	tryfleur	\N	#hairtransformation #hairgrowth #hairtok #bloompeptidehairserum #hairgrowthtips 	\N	2025-10-09 21:18:49	1760044729	16	307	8	4	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7559334475960765710?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ogLwXNkR0AORHtnKIPoEHjTCkYQegeleIPsAgG~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=79cdf1dd&x-expires=1760533200&x-signature=DeZZ7uRhvK9HrgJqauozlY1npwU%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.393732	2025-10-14 13:21:56.928673	8
7558168355031534861	tryfleur	\N	#hairtok #hairthinning #hairgrowth #bloompeptidehairserum #peptideserum 	\N	2025-10-06 17:54:07	1759773247	11	315	11	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7558168355031534861?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/owAgDEHoSEABgRWQCqIfBFB5vDfwQAIkPaZSTg~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=cefc824f&x-expires=1760533200&x-signature=4hEBsX%2BfDPIsyAR7eadA53U%2BI%2BE%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.399757	2025-10-14 13:21:56.935746	8
7482867503169883434	tryfleur	\N	New day, new you, new Growth. ✨ Healthy, thriving hair starts with consistency, care, and the right ingredients. Fleur’s Peptide Hair Formula nourishes your scalp at the root—supporting stronger, thicker, healthier hair with every use. 🌱 Your hair’s next chapter starts today. Are you ready? 🔗 Shop now at TryFleur.com or directly from our TTS 😊 #FleurHair #NewGrowth #PeptidePowered #HealthyHairJourney #MinimalLuxury	\N	2025-03-17 19:48:21	1742240901	17	82	2	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7482867503169883434?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocvrISCnDgAQMGRQAEQIfACAwDkD2F8yHS9f6E~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=90319eb4&x-expires=1760533200&x-signature=4WKn7854VkR0iiOwjUm%2BxrGaDc8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.460676	2025-10-14 13:21:56.999612	8
7559361360769961271	tryfleur	\N	Did you know your hair can actually grow faster when it’s nourished with the right nutrients? 👀  Most of us focus on the ends, but true growth starts at the scalp. Our Bloom Peptide Hair Serum is infused with powerful multi-peptides that help strengthen the follicle, boost circulation, and encourage new growth where it matters most. 🌱 Unlike heavy oils that weigh your hair down, this lightweight, water-based formula absorbs quickly and delivers deep hydration and nutrients directly to your roots. Over time, you’ll notice thicker strands, stronger ends, and less breakage because your hair is finally being fed what it needs to thrive. 💆‍♀️✨ If you’ve been struggling with slow growth, postpartum shedding, or thinning edges, this serum was made for you. It’s your daily dose of confidence, bottled. 💖 Tap “Add to Cart” to start your healthy hair journey today. #hairhealth #hairthinning #bloompeptidehairserum #hairgrowth #hairtok 	\N	2025-10-09 23:03:35	1760051015	17	320	7	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7559361360769961271?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/osP32iuEiIHIgd6UDofeQ8gARNVhoBSdDCO0By~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=61d23526&x-expires=1760533200&x-signature=K3PcEyYCmDcFy6AeT0SjS6AhfSE%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.392883	2025-10-14 13:21:56.927704	8
7463868346467945771	tryfleur	\N	the most advanced hair + scalp serum ever designed.  #HealthyHairJourney #HairSerumMagic #PeptideHairCare #ThickerHairSolutions #HairGrowthEssentials #PeptidePower #LustrousLocks #ThinningHairSolutions #TransformYourTresses #ScalpHealthMatters #PeptideInfused #FullerHairDreams #HydrateYourHair #HairGrowthSupport #ShinyHairGoals #ThickerAndStronger #HairBoost #LoveYourHairAgain #HairSerumWorks #StrongHairStrongYou	\N	2025-01-25 15:02:16	1737817336	11	182	4	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7463868346467945771?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ooQTgAcAM8xUAeMeVXJt8eIQYnYivQAAQgfeSn~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=34a9d824&x-expires=1760533200&x-signature=%2BUkIT%2BFYm1lcYSRx8dMQSWgLzRk%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.46725	2025-10-14 13:21:57.006855	8
7558252577226296631	tryfleur	\N	Our Bloom Hair serum uses GHK-Cu Copper Peptide and five other powerful peptides to jumpstart hair growth. #peptidetherapy #hairgrowth #hairgrowthtips #ghkcupeptide #copperpeptides 	\N	2025-10-06 23:20:42	1759792842	22	339	5	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7558252577226296631?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o0tJZBA9iIAetMWRAYN8gngIevIfgCHkiGqjyL~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=c7a57af5&x-expires=1760533200&x-signature=SM%2FuujqBaORy4pOnaajdrl6bk0s%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.398248	2025-10-14 13:21:56.934003	8
7558975027060755725	tryfleur	\N	Bloom is a water-based, multi-peptide serum designed for daily, not drastic care-light texture, zero residue, and made to absorb into the scalp (not coat the hair). Peptides like GHK-Cu, AHK-Cu, PAL-AHK, GHK, Zn-Thymulin, and PTD-DBM help support a healthier follicle environment by signaling cellular repair pathways and balancing the scalp micro-ecosystem. Because the formula is water-based, it absorbs quickly without the occlusive film oils can leave, so it layers cleanly under your normal routine. Use 3-5 small drops on the scalp and massage for 30-60 seconds. Consistency matters more than quantity. A temporary uptick in shedding can occur in the first few weeks as older hairs cycle out; most people notice stronger, fuller-looking strands with steady use over 3-6 months. Have questions about routines or ingredients? Drop them below. Shop directly through TikTok.  #hairtransformation #hairthinning #hairgrowthtips #bloompeptidehairserum 	\N	2025-10-08 22:04:08	1759961048	5	317	4	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7558975027060755725?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMQmQLDJR3i5ArDotFfrf1TPi9qESE8gSPt9Bt~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=e84e9563&x-expires=1760533200&x-signature=TlABI59%2BGfR%2B97yCY3tFFTZAwo8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.395333	2025-10-14 13:21:56.930461	8
7558932757750107405	tryfleur	\N	If only 👀✨ #hairtips #hairtransformation #hairhelp #hairgoals #bloompeptidehairserum  	\N	2025-10-08 19:19:53	1759951193	5	366	6	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7558932757750107405?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o0bmDAwcfAEgcs3tBBI0rVAFuiBpiCJ9M1DISx~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=4ff77c51&x-expires=1760533200&x-signature=kHLaOtwXm%2FwvR5LHa7HgYHkiKZc%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.39613	2025-10-14 13:21:56.931314	8
7558558772197674254	tryfleur	\N	Struggling with thinning or shedding hair? You’re not alone and it usually starts deep at the follicle, long before you notice it. That’s exactly where our Bloom Hair Serum goes to work. 🌿 Powered by GHK-Cu copper peptide and five other clinically backed peptides, this formula can help reactivate dormant follicles, strengthen weak strands, and boost visible growth from the root up. 🧬✨ Each drop is lightweight, non-greasy, and designed to nourish your scalp at the molecular level, because real hair growth starts beneath the surface, not just on it. If you’re ready for thicker, fuller, healthier hair, tap our TikTok Shop and try Bloom Peptide Hair Serum today. Your confidence (and your hairline) will thank you. 🤎✨ #hairthinning #hairtok #hairgrowthtips #bloompeptidehairserum #peptidehairserum 	\N	2025-10-07 19:08:36	1759864116	25	340	5	3	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7558558772197674254?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/osXRDEgdQYoI6WEmQBKXtSFW35KfyDfWpiA2HL~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=f0b6281d&x-expires=1760533200&x-signature=mJtPutk377jK%2F8t9h%2BTXVD8szVQ%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.397546	2025-10-14 13:21:56.93304	8
7549308516113190199	tryfleur	\N	It’s time to bloom again #healingjourney #selfcare 	\N	2025-09-12 20:53:21	1757710401	7	325	20	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7549308516113190199?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ow3RDEgIQhoKnEEEQBE1nSFfoxgGiDfIxtAMaB~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=28a37a24&x-expires=1760533200&x-signature=hiHKit5ib9KLSh%2FHV83fK%2BSch6g%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.427407	2025-10-14 13:21:56.968239	8
7558621254396169486	tryfleur	\N	Work smarter, not harder. ✨ Skip the endless trial and error, our Bloom Peptide Hair Serum does the heavy lifting for you. Powered by GHK-Cu Copper Peptide and five other growth-boosting peptides, it helps reactivate dormant follicles, strengthen weak strands, and promote thicker, fuller hair over time. 🌿💆‍♀️ Shop smarter and get Bloom Peptide Hair Serum directly through TikTok Shop today. Your best hair starts here. 💖 #hairthinning #hairtok #hairgrowthtips #bloompeptidehairserum #peptide 	\N	2025-10-07 23:11:20	1759878680	11	351	7	1	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7558621254396169486?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ooHcjnEIIDgog85fbnFSliTIeh3JWEAlDBZRC2~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=896f2b02&x-expires=1760533200&x-signature=RszN90hqhRkEvGg%2FzOUMF93SLzQ%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.396823	2025-10-14 13:21:56.932203	8
7556406691391081783	tryfleur	\N	Confidence Starts at the Root. Plant the seed. 🪴  Shop Bloom Peptide Hair Serum directly through TikTok Shop. #hairhealth #hairthinning #hairgrowthoil #serum #peptideserum 	\N	2025-10-01 23:57:40	1759363060	11	292	7	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7556406691391081783?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ow5GHdQ779D2etIeRYfbf7ABM8ArWOt8VFvjvB~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=4246a05c&x-expires=1760533200&x-signature=%2F3OLAS%2FUPMDcOHKOhas3yolHqBI%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.404447	2025-10-14 13:21:56.94319	8
7556404122157714702	tryfleur	\N	Your hair isn't waiting for miracles, it's waiting for instructions.  Bloom Peptide Serum is designed with gentle, science-backed peptides that signal your scalp to stay in its healthiest rhythm. Unlike heavy oils, our water-based formula absorbs effortlessly, leaving your scalp nourished and your hair free to grow stronger. Shop Bloom directly through TikTok Shop. 🤎✨ #peptidetherapy #hairgrowth #hairgrowthtips #ghkcupeptide #copperpeptides	\N	2025-10-01 23:47:49	1759362469	11	286	5	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7556404122157714702?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oQDdM2UibBaUnDaIALnNDIr7vviBE965gNNc4~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=acf0a022&x-expires=1760533200&x-signature=3yJ%2FMWdiD%2Beun%2FJTcu8KQGOBoyI%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.405176	2025-10-14 13:21:56.943965	8
7423519320371760426	\N	but he said yes i hope none of my family members see this LMAO	\N	{}	2025-10-14 13:45:59.756	\N	7	534402	63858	428	23289	0.16387476	\N	\N	\N	\N	\N	https://www.tiktok.com/@kylieandcompany/video/7423519320371760426	\N	https://p19-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ow4EafaFBgMRDgRIBLtEAABSoDBFEd1fnKOcrE~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=14782&refresh_token=9191156b&x-expires=1760533200&x-signature=LWz7XpzTP20haNGI1N11D%2B1Duzk%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=1d1a97fc&idc=maliva&biz_tag=tt_video&s=AWEME_DETAIL&sc=cover	but he said yes i hope none of my family members see this LMAO	kylieandcompany	Kylie - Creator + Ambassador	https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/30a00e55ec478a61b88e5d5634f272c7~tplv-tiktokx-cropcenter:300:300.jpeg?dr=14577&refresh_token=8c08c561&x-expires=1760533200&x-signature=H165zA%2Fc4Q%2FIBZPDi8o629B6X%2B4%3D&t=4d5b0474&ps=13740610&shp=d05b14bd&shcp=34ff8df6&idc=maliva	original sound - scarflosgf	emilia's wife	t	2025-10-14 13:45:59.767383	2025-10-14 13:46:16.280268	\N
7557483545636179214	tryfleur	\N	Confidence Starts at the Root. 🤎✨ Shop Bloom Peptide Hair Serum directly through TikTok Shop.  #hairtok #hairthinning #hairgrowth #peptideserum #bloompeptidehairserum 	\N	2025-10-04 21:36:23	1759613783	5	348	8	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7557483545636179214?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oEhEcfF4CIDiJjBAGCMgfSEsohQaRK6DSm1ZkB~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=3acdeed9&x-expires=1760533200&x-signature=lFka%2BzaNAdwVqndGyKRVNJpHkDo%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.401416	2025-10-14 13:21:56.93978	8
7557121483772824846	tryfleur	\N	Your hair isn't waiting for miracles, it's waiting for instructions.  Our serum uses clinical-grade peptides that talk directly to your cells, telling them to grow, strengthen, and restore. It's not magic. It's molecular. Ready to see what science can do for your hair? 💧✨ #peptidetherapy #hairgrowth #hairgrowthtips #ghkcupeptide #copperpeptides 	\N	2025-10-03 22:11:31	1759529491	13	308	5	3	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7557121483772824846?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oAfEXSPnQQkCSi4BmgZDfD8VpzAFFkEgi1KoQS~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=816c2bdf&x-expires=1760533200&x-signature=aD6nnzmqrdBz0NBlaCkxwd8K21I%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.402125	2025-10-14 13:21:56.940724	8
7556703323974405389	tryfleur	\N	Healthy, thriving hair starts at the root. Our Peptide Hair Formula Bloom restores scalp health and supports stronger, thicker, healthier hair-without the irritation or side-effects. Your best hair is waiting. Shop Bloom directly through TikTok Shop. 🍎✨ #ghkcupeptide #peptideserum #hairgrowthtips #hairgrowthserum #hairthinning 	\N	2025-10-02 19:09:09	1759432149	10	326	7	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7556703323974405389?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oc6gdA4bcGzetQLeIYLeAzgINAOcNNfeioKGFy~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=51df72e3&x-expires=1760533200&x-signature=NRkMF14D0KFrroyLjmJkGdiNsA8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.402925	2025-10-14 13:21:56.941547	8
7556701345093258551	tryfleur	\N	Confidence doesn't happen overnight, it's built strand by strand. Bloom Peptide Serum is designed with gentle, science-backed peptides that signal your scalp to stay in its healthiest rhythm. Unlike heavy oils, our water-based formula absorbs effortlessly, leaving your scalp nourished and your hair free to grow stronger. Your scalp deserves a self-love ritual. Every drop is crafted with clean, purposeful ingredients to support healthier, fuller-looking hair over time. Shop directly through TikTok Shop. 🤎✨ #hairthinning #hairgrowthserum #peptideserum #ghkcupeptide #hairgrowthtips 	\N	2025-10-02 19:01:21	1759431681	0	127	7	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7556701345093258551?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/7b2e7c73ad154686a2bd44a4253d577c~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=dcc43408&x-expires=1761742800&x-signature=Za2jxwKQ7oqi8jDbKUrVo%2BnN5go%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_photomode	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.403655	2025-10-14 13:21:56.942412	8
7554538108235025677	tryfleur	\N	The future of haircare is here. Our award-winning chemists created Bloom, a water-based, peptide-powered serum designed to nourish your scalp and strengthen your strands. No oil. No build-up. Just results. 🤎 Safe for color + chemically treated hair. 🤎 PETA-certified cruelty-free. 🤎 Confidence starts at the root.  #ghkcuhairgrowth #peptide #ghkcu #hairtok #copperpeptides  	\N	2025-09-26 23:06:38	1758927998	15	368	7	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7554538108235025677?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oQvmIcrrAhfjAQtIRBQ7BBLTIiHXkjeHCnFkGf~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=1ba25132&x-expires=1760533200&x-signature=VKagFD3GvonjQ6WM9RvgR95a99A%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.410296	2025-10-14 13:21:56.949608	8
7556034792219856183	tryfleur	\N	Pick yourself this apple season and nourish your hair from the root with a luxurious hair serum. 🍎🧺 #applepicking #fallactivities #hairgrowthtips #hairgrowth #ghkcuforhairgrowth 	\N	2025-09-30 23:54:36	1759276476	17	303	8	2	3	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7556034792219856183?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ooIIZp0AjXjW6XkcBBINKbibFGFAbwfxibCKDb~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=35b24e7b&x-expires=1760533200&x-signature=ZqxcPLVWldM%2FvyUPU%2FKLkMdMgEo%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.406743	2025-10-14 13:21:56.945506	8
7555653534167960887	tryfleur	\N	We’re the biggest catch when it comes to real results in your hair growth journey. #peptide #ghkcu #hairtok #ghkcuhairgrowth 	\N	2025-09-29 23:15:08	1759187708	6	458	7	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7555653534167960887?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oIK2Df1rEEgSIvEWeBogFBYbIORxAIpnDD2ugW~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=d14a149f&x-expires=1760533200&x-signature=oLQhgaWftHOwmXwH%2FrGQneKVj88%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.407418	2025-10-14 13:21:56.946311	8
7555617398137638158	tryfleur	\N	Let's make hair care simple. 🪞👱‍♀️✨ Bloom is a water-based, multi-peptide serum designed for daily, next gen haircare, light texture, zero residue, and made to absorb into the scalp (not coat the hair). 💧👩‍🦳 Peptides like GHK-Cu, AHK-Cu, PAL-AHK, GHK, Zn-Thymulin, and PTD-DBM help support a healthier follicle environment by signaling cellular repair pathways and balancing the scalp micro-ecosystem.🧑‍🔬🤎 Because the formula is water-based, it absorbs quickly without the occlusive film oils can leave, so it layers cleanly under your normal routine. Use 3-5 small drops on the scalp and massage for 30-60 seconds. 🕰️ Consistency matters more than quantity.  A temporary uptick in shedding can occur in the first few weeks as older hairs cycle out; most people notice stronger, fuller-looking strands with steady use over 3-6 months. Have questions about routines or ingredients? Drop them below. 🐈‍⬛🌙✨ #pe#peptideh#ghkcua#haircareserumsh#ghkcuhairgrowth	\N	2025-09-29 20:54:37	1759179277	17	319	6	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7555617398137638158?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oU0xpxaoOA2EXAiIxBKIngxClbCPwufTtg8Big~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=527ba3f4&x-expires=1760533200&x-signature=Q1JBHVoDbtZD0Cd%2Bs4U5cyE0qPk%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.408175	2025-10-14 13:21:56.947154	8
7554893586144251150	tryfleur	\N	every strand, every step, every season.	\N	2025-09-27 22:06:12	1759010772	9	376	52	2	7	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7554893586144251150?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oEfEYcfADKBikKguzBBmSoI92Ih4HXRXFiZEnm~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=abef9f00&x-expires=1760533200&x-signature=cz97nupY%2FDb8%2BjXOayfdNYDvPP8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.40887	2025-10-14 13:21:56.94792	8
7554825054798744845	tryfleur	\N	We’ve all been there… 	\N	2025-09-27 17:40:16	1758994816	10	375	19	7	7	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7554825054798744845?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o0IEYFoOBB5bDfDJIfRNuSEgEDIT62qSxX4ARY~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=10ac0856&x-expires=1760533200&x-signature=Ft1Xg8xyLGhRw78nRvmtxavQDMw%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.409582	2025-10-14 13:21:56.948761	8
7554493545084734733	tryfleur	\N	Discover your new favorite self care hair care serum. Our serum acts as a scalp serum that is not washed out. It a light weight  thin layer #peptide #ghkcu #copperpeptides #haircareserums #ghkcuhairgrowth  	\N	2025-09-26 20:13:55	1758917635	0	144	7	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7554493545084734733?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/8f37cb0fabf74481924ecdff6224b4db~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=726db195&x-expires=1761742800&x-signature=vasCTGunjlGxBJnamIedztOtQug%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&biz_tag=tt_photomode&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.412016	2025-10-14 13:21:56.951295	8
7551219292017020215	tryfleur	\N	Wishing you got hair autumn for the rest of your life!! 🤎👀 #thickhair #howtogrowyourhair #hairtok #healthyhair #copperpeptides 	\N	2025-09-18 00:27:53	1758155273	8	348	6	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7551219292017020215?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oUZiUaiELBWzIPACCgS4BCUz8CMtIgFviBAgP~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=a7712986&x-expires=1760533200&x-signature=muJqIbJnpVQMgkgFrApnipBr288%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.419218	2025-10-14 13:21:56.961132	8
7559093535841013022	\N	Educational purposes only. Not medical advice. Think hair follicles are dead? They’re probably just sleeping. Three peptides are waking them up: GHK-Cu - The reset button • 70% saw thicker hair in studies • 30-50% less shedding in 8 weeks • Destroys old collagen clogging follicles • Builds fresh collagen where you need it TB500 - The stem cell activator • Doubled active follicles in animal studies (7 days!) • Builds blood vessels to feed roots • Wakes up dormant follicles PTD-DBM - Creates NEW follicles • Blocks the protein preventing follicle formation • Bald mice grew hair in 28 days • Activates master switch for new hair Together they attack from all angles: GHK rebuilds foundation TB500 wakes sleeping follicles PTD-DBM creates new ones The future isn’t expensive transplants or side-effect-heavy drugs. It’s reprogramming your scalp at the cellular level. Free school is open with exact protocols. Join us. Do your research. Individual results vary. Who’s ready to wake up their follicles?​​​​​​​​​​​​​​​​	\N	{}	2025-10-14 14:51:10.373	\N	185	145674	5485	624	1582	0.05279597	\N	\N	\N	\N	\N	https://www.tiktok.com/@barrythebiohacker/video/7559093535841013022?_r=1&_t=ZT-90XrsOzcDkM	\N	https://p16-pu-sign-useast8.tiktokcdn-us.com/tos-useast8-p-0068-tx2/o81ZEXfDVQiGRNoEUlfyn510OByAWEqQFGLWQA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=14782&refresh_token=6181cf8e&x-expires=1760536800&x-signature=7nldUKzf%2B%2B3QBzoe1%2FoLw1uMzm0%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=1d1a97fc&idc=maliva&biz_tag=tt_video&s=AWEME_DETAIL&sc=cover	Educational purposes only. Not medical advice. Think hair follicles are dead? They’re probably just sleeping. Three peptides are waking them up: GHK-Cu - The reset button • 70% saw thicker hair in studies • 30-50% less shedding in 8 weeks • Destroys old collagen clogging follicles • Builds fresh collagen where you need it TB500 - The stem cell activator • Doubled active follicles in animal studies (7 days!) • Builds blood vessels to feed roots • Wakes up dormant follicles PTD-DBM - Creates NEW follicles • Blocks the protein preventing follicle formation • Bald mice grew hair in 28 days • Activates master switch for new hair Together they attack from all angles: GHK rebuilds foundation TB500 wakes sleeping follicles PTD-DBM creates new ones The future isn’t expensive transplants or side-effect-heavy drugs. It’s reprogramming your scalp at the cellular level. Free school is open with exact protocols. Join us. Do your research. Individual results vary. Who’s ready to wake up their follicles?​​​​​​​​​​​​​​​​	barrythebiohacker	barrythebiooptimizer	https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/53a9e7f3ff46b71d4dca9a37b19d253a~tplv-tiktokx-cropcenter:300:300.jpeg?dr=14577&refresh_token=13d6fb24&x-expires=1760536800&x-signature=ey8TcLVwoMSItf6bbB2WkfkYgaw%3D&t=4d5b0474&ps=13740610&shp=d05b14bd&shcp=34ff8df6&idc=maliva	original sound - barrythebiohacker	barrythebiooptimizer	t	2025-10-14 14:51:10.3739	2025-10-14 14:51:31.033299	\N
7554112336412413214	tryfleur	\N	#pintrest #buyflowers #bloompeptidehairserum 	\N	2025-09-25 19:34:09	1758828849	8	349	13	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7554112336412413214?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast8-p-0068-tx2/oMEEsHi1uIBpf3EAjIQAfCiBoVIMRnREVWTZmB~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=e77bfe8d&x-expires=1760533200&x-signature=4nRkltSoYJKjDbXNe8gPSFxOems%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.413526	2025-10-14 13:21:56.952837	8
7553768954745900302	tryfleur	\N	She’s our hair dream goals and your hair can be dense and full once again too! Our bloom peptide hair serum utilizes six copper peptides that are known to support hair growth, hair density, and the overall appearance of your hair. With consistent use most see results in two-three months. #peptide #ghkcu #copperpeptides #hairtok #haircareserums	\N	2025-09-24 21:22:02	1758748922	8	404	10	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7553768954745900302?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ogPjiBaIIAp8j2CCzBYiJAARyInIwji20UAc9f~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=8cf141c5&x-expires=1760533200&x-signature=6hi6GcoMV5Yyns7eJFUVL7woP6o%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.414227	2025-10-14 13:21:56.953632	8
7553455030058192183	tryfleur	\N	🤎 can help support the appearance of thicker, fuller-looking hair. 🤎 helps nourish and strengthen strands. 🤎 works at the root level to condition the scalp. 🤎 promotes a healthy-looking scalp environment. 🤎 lightweight formula that absorbs easily into the skin. #ghkcupeptide #thickhair #peptide #haircareserums #haircareserum	\N	2025-09-24 01:03:37	1758675817	0	146	7	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7553455030058192183?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/c05ce7f970794e7e965d2586394abc4c~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=9ba5640f&x-expires=1761742800&x-signature=SXi37VkNC69jxRrdp5nA84CunhU%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&biz_tag=tt_photomode&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.415141	2025-10-14 13:21:56.954381	8
7553047185349299470	tryfleur	\N	Our Bloom Hair serum uses GHK-Cu copper peptides and five other powerful peptides to jumpstart and support hair growth. #peptidetherapy #hairgrowth #hairgrowthtips #ghkcupeptide #copperpeptides 	\N	2025-09-22 22:41:19	1758580879	12	603	15	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7553047185349299470?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ooTRMfDDeAIvNjbkAgLEookGBewybS6IHICGjg~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=5d64f3ff&x-expires=1760533200&x-signature=eRBxcr8p1pbURj8dYsEo%2B4cOW24%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.416557	2025-10-14 13:21:56.956031	8
7553021746182507789	tryfleur	\N	Love yourself today #selflove #selfcare #buyflowers 	\N	2025-09-22 21:02:32	1758574952	15	325	23	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7553021746182507789?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ogoRx0EGBvpFIjStErizcfgQDfAhFDJxTBiobQ~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=6161425d&x-expires=1760533200&x-signature=FpXBmgHIW78VR04vYg5k8GbVsNA%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.417242	2025-10-14 13:21:56.956871	8
7551827540504038670	tryfleur	\N	Unlock powerful hair, your confidence will thank you. #hairtok 	\N	2025-09-19 15:48:02	1758296882	6	296	5	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7551827540504038670?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oIzaRoAszOaEEeUkDAQgtprf32SgGFQDDSSBMX~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=cbb90aee&x-expires=1760533200&x-signature=syLFQxbCLWtX2alHBW1u6g8HqGA%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.417872	2025-10-14 13:21:56.957817	8
7549550228731399479	tryfleur	\N	Sometimes the shadow is just the beginning, your bloom is on the other side 🌸 #HairGrowth #healingjourney #selfcare #haircare 	\N	2025-09-13 12:31:24	1757766684	9	346	6	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7549550228731399479?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oI0g9IZmAfIEWoSoRDZBDOqVBEI7INFFnvIxfD~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=1f70cdb2&x-expires=1760533200&x-signature=aZuAF091TIDNtpmyeZfUMJBofo0%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.426402	2025-10-14 13:21:56.967434	8
7554499031154691341	tryfleur	\N	Confidence doesn't happen overnight — it's built strand by strand. Bloom Peptide Serum is designed with gentle, science-backed peptides that signal your scalp to stay in its healthiest rhythm. Unlike heavy oils, our water-based formula absorbs effortlessly, leaving your scalp nourished and your hair free to grow stronger. Your scalp deserves a self-love ritual. Every drop is crafted with clean, purposeful ingredients to support healthier, fuller-looking hair over time. Comment grow for a direct link to start your hair journey today. #peptide #ghkcu #copperpeptides #haircareserums #ghkcuhairgrowth 	\N	2025-09-26 20:35:14	1758918914	5	366	4	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7554499031154691341?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oYnRuuFWkQDFrpEAfG4AfXEIjtQMGLFOIdQeeF~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=ffdba326&x-expires=1760533200&x-signature=WbUnq6qRhw41PofvoluOxYXtAps%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.411221	2025-10-14 13:21:56.950497	8
7551193454500400398	tryfleur	\N	Our Bloom Peptide Hair Serum is crafted with GHK-Cu and a blend of advanced peptides to support the look of healthier hair from the scalp and follicle, encouraging the appearance of natural growth and fullness. #ghkcu #peptide #scalpcare #hairtok #copperpeptides 	\N	2025-09-17 22:47:49	1758149269	94	435	7	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7551193454500400398?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oU6wQeEQQDgo0YyfxdFSWNmJKSl9oEASDBzRFy~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=813a5543&x-expires=1760533200&x-signature=%2FGF8u9RcbtAGRbrcrrDcjDsmgoE%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.420051	2025-10-14 13:21:56.961922	8
7550383030712487181	tryfleur	\N	Water-based, feather-light, and refined, it’s hair care elevated into ritual 🤎✨ At the root of beauty lies science 🧬 Bloom Peptide Hair Serum blends GHK-Cu with advanced peptides, an elegant harmony crafted to support the look of fuller, more resilient strands. #peptide #ghkcu #haircare #hairscience 	\N	2025-09-15 18:22:59	1757960579	8	302	6	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7550383030712487181?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oAFjYBVoyAVaDb6CE1RFDRWBSSIfI13cEfTgID~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=5139be63&x-expires=1760533200&x-signature=IZ7bcpuUT81DMtpfoHg9p3FkVUE%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.422914	2025-10-14 13:21:56.964255	8
7549733803644685599	tryfleur	\N	bloom peptide hair serum. 🌞🤎  Just work it into damp hair + scalp, leave it in, and let Bloom support you.🌿 Available on TikTok Shop ✨ #hope #hairtok #hair #peptidesforhair 	\N	2025-09-14 00:23:14	1757809394	6	351	6	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7549733803644685599?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast8-p-0068-tx2/oEh3BgmdYnjAkWqKz5IfFLGRGQeGMAeU6geMJP~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=1189282f&x-expires=1760533200&x-signature=yyY1s8zL1WMY7ay0ymp1AziJsyg%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.4247	2025-10-14 13:21:56.965794	8
7549553521398484237	tryfleur	\N	To be kissed by GHK-Cu peptides is to feel your hair revived, renewed, reborn ✨ #peptide #ghkcu #peptidesforhair 	\N	2025-09-13 12:44:32	1757767472	7	364	6	3	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7549553521398484237?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8H4VIvBvGZgNEzcAa2t5EjUTFFliiMKIUBzT~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=359d677c&x-expires=1760533200&x-signature=KHK9xjGwvCrNozaHZLdMAe1H%2Fd0%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.425565	2025-10-14 13:21:56.966621	8
7547830075463437581	tryfleur	\N	Bloom Peptide Hair Serum is crafted with GHK-Cu and a blend of advanced peptides to support the look of healthier hair from the scalp and follicle, encouraging the appearance of natural growth and fullness. #ghkcu #peptide #scalpcare #hairtok #peptidetherapy 	\N	2025-09-08 21:16:14	1757366174	8	900	12	1	6	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7547830075463437581?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oUiNgfPRAMQFnAeDERBF8X6W8OIUxgpwGofeJL~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=6bc04be8&x-expires=1760533200&x-signature=aG%2FCKHRxCplKvVy%2FLT%2Ful01NVTM%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.435249	2025-10-14 13:21:56.975215	8
7560820578072923406	tryfleur	\N	Our Bloom Peptide Hair Serum is here disrupt the hair serum industry. Packed with peptides like GHK-Cu, AHK-Cu, PAL-AHK, GHK, Zn-Thymulin, and PTD-DBM that help support a healthier follicle environment by signaling cellular repair pathways and balancing the scalp micro-ecosystem. Because our Bloom formula is water-based, it absorbs quickly without leaving oily films behind making it layers cleanly under your normal routine. Use 3-5 small drops on the scalp and massage for 30-60 seconds. Consistency matters more than quantity. A temporary uptick in shedding can occur in the first few weeks as older hairs cycle out; most people notice stronger, fuller-looking strands with steady use over 3-6 months. #hairscience #hairtok #bloompeptidehairserum 	\N	2025-10-13 21:25:52	1760390752	53	269	3	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7560820578072923406?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oAagsKiIIBw0Z0dfnbipthzjgma3TCAWBArIB1~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=1565944b&x-expires=1760533200&x-signature=pqm5tYfGm6gDoGa9ZlwrbHq7Wts%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.386321	2025-10-14 13:21:56.921916	8
7550710162248568077	tryfleur	\N	Unapologetically loving my hair. ##trendingaudio##fyp##hairtok	\N	2025-09-16 15:32:45	1758036765	8	313	8	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7550710162248568077?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/og9gktgbAtKEYeSoRk3BDp7ixEIYIDFJuLUyfD~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=22c55f9c&x-expires=1760533200&x-signature=sVEV3TUgJYLsDgst4%2FqdwZk6XIA%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.42199	2025-10-14 13:21:56.963466	8
7548871552876514573	tryfleur	\N	Unleash your inner feline 🐈🐈‍⬛✨ ##divinefeminine##selfcare##haircareserum##scalpcare	\N	2025-09-11 16:37:16	1757608636	6	361	19	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7548871552876514573?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/okyOY6jQF0qGGFf9ANIXeeI3LRAGOJCTeubYQQ~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=c8e82e9d&x-expires=1760533200&x-signature=mHzvnXDJ7JL%2Bcq91rviJJTfDdmU%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.430902	2025-10-14 13:21:56.971262	8
7138288628928744747	joshuacrowe	\N		\N	2022-09-01 06:05:43	1662012343	386	68	4	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7138288628928744747?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/f808a974c97a48c8b9d3b1f7af0a02d2~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/a36626fa875f49a7ab7efe5c697551e0.jpeg?dr=8595&refresh_token=0770852e&x-expires=1760569200&x-signature=CI5NUuYw56zlGkS%2F1jto3rYHl4A%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.391214	2025-10-14 23:14:42.391214	6
7548971835933723959	tryfleur	\N	Self-care isn’t vanity, it’s divinity. Bloom into your divine feminine energy with every ritual ✨ #haircare #selfcareritual #hairgoals #peptidesforhair	\N	2025-09-11 23:06:25	1757631985	0	361	39	3	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7548971835933723959?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/c8ea2f55d1e74d42a6a8dd3ea233ccf0~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=06b84d4a&x-expires=1761742800&x-signature=3Ea9qkEEDd6zJWO5b%2FPQf66%2BSwE%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&biz_tag=tt_photomode&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.430055	2025-10-14 13:21:56.97046	8
7548633603450653966	tryfleur	\N	#peptide #hairtok #selfcare #ritual #scalpcare 	\N	2025-09-11 01:14:23	1757553263	8	310	4	1	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7548633603450653966?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oUmoCqJfTAm0DRmngIFVwISDrfM0NniEDEB7CI~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=f2af3194&x-expires=1760533200&x-signature=Psl6jmiZIfvfNJIrzh3tMXlVim8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.431717	2025-10-14 13:21:56.971983	8
7546647113313078542	tryfleur	\N	Welcome to your peptide family. Peptides are becoming a quiet revolution in healthy haircare routines all around the world. Fleur is building a community around these revolutionary peptides. Bloom is our peptide hair serum and it is hair science in a bottle.  Think of this space as more than just about hair, it’s about growth, confidence, and showing up for yourself everyday. Don’t worry, it’s not too late to join the peptide family!! ##ghkcupeptide##peptide##peptok	\N	2025-09-05 16:45:59	1757090759	15	1006	17	4	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7546647113313078542?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ooOceAGdREaH8LjHRerzdCkIAIy7CemIlBZiIg~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=9c1c5225&x-expires=1760533200&x-signature=ld4P7K5g5patANM67xbtSCWm9gg%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.436088	2025-10-14 13:21:56.975969	8
7137889889592446254	joshuacrowe	\N	$2,000,000 CLIENT GOES BROKE DUE TO COMMON RETIREMENT RISKS: PART 1 #retirement #retirementplanning #retire 	\N	2022-08-31 04:18:22	1661919502	600	80	4	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7137889889592446254?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/4a50696b746b4b27927db77e2398c023_1661919525~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/00a69d983f1545c89f19b0c46ff07d1a.jpeg?dr=8595&refresh_token=ca3b8a32&x-expires=1760569200&x-signature=feOF8JpmLnc3uAUm60yTQbBYwwI%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.394083	2025-10-14 23:14:42.394083	6
7537907137381403959	tryfleur	\N	Protected. Perfected.  #peptide #BloomPeptideSerum #LuxuryHairCare #HairCareSecrets	\N	2025-08-13 03:29:42	1755055782	5	425	7	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7537907137381403959?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oonAEBEAqgDbREgzYMkCFhcDfoSGeoQEBZQsDi~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=f2d2eed0&x-expires=1760533200&x-signature=lnQ9E96ai44FeFYhz8xxnrqjP%2Fw%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.439696	2025-10-14 13:21:56.980329	8
7135324543677304110	joshuacrowe	\N	69 Year Old Turns $100k Into $300k With Long-Term Care Insurance: Part 2 #longtermcare #ltc #retirement	\N	2022-08-24 06:23:33	1661322213	390	47	1	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7135324543677304110?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/9c2619d1e6f74a0081a081f99576c494~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/e09fcfc24a5748b38d1763e3766aee20.jpeg?dr=8595&refresh_token=1b6053b8&x-expires=1760569200&x-signature=2mEztTRvCV8TT4cAFePslps884U%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.395235	2025-10-14 23:14:42.395235	6
7546578329659280653	tryfleur	\N	Our Bloom Hair serum uses GHK-Cu Copper Peptide and five other powerful peptides to jumpstart hair growth. #peptidetherapy #hairgrowth #hairgrowthtips #ghkcupeptide #copperpeptides 	\N	2025-09-05 12:19:13	1757074753	6	1356	22	2	3	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7546578329659280653?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o4QI6FR8aCZPHBDNQfKOtkMAEZ1Mwd9eRepAjU~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=ebb6f94c&x-expires=1760533200&x-signature=73A7W%2BJ1CUmiTURqaAWUWs945sA%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.437024	2025-10-14 13:21:56.976726	8
7546021961529445645	tryfleur	\N	self love starts at the root 💓 #hairrepair #peptideserum #haircareserum #tryfleur #hairgrowth 	\N	2025-09-04 00:19:39	1756945179	8	289	5	3	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7546021961529445645?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/og0BiAPBGC6bGu24IIBxifNJp2Xz0IAYBBAIwM~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=371f6fd9&x-expires=1760533200&x-signature=j8HlIrNze3hW9cql4PMXLwllH6Q%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.43794	2025-10-14 13:21:56.977449	8
7537932450962394382	tryfleur	\N	and every single one still feels like our first 💛 50 Bloom bottles. 50 hair journeys. We’re just getting started, thank you for trusting us with your hair goals.  #HairCareJourney #TTS #TikTokShopFinds #PeptideHairCare #tiktokshop 	\N	2025-08-13 05:07:57	1755061677	5	203	3	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7537932450962394382?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/okgCyTB28iyWAApUB009ITwG1iErfB3BIcHayB~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=f015cd5c&x-expires=1760533200&x-signature=gtqtTGp%2BLPDLU4eYf8nJoax0Vus%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.438838	2025-10-14 13:21:56.979318	8
7520269234409098551	tryfleur	\N	Slide through to see what Fleur is all about. #PeptidePowered  #HairScience  #FleurFacts #GHKCU #AHKCU #ZnThymulin #PTDDBM #PeptideHairGrowth #CopperPeptides #HairPeptides #PALAHK	\N	2025-06-26 14:45:42	1750949142	0	988	16	5	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7520269234409098551?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/93c77e9a831b41e2b2e43bd67d18184f~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=179d6a36&x-expires=1761742800&x-signature=5oxMbG1Qh9KxRN%2BNeddRDxu%2ByYU%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&biz_tag=tt_photomode&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.441403	2025-10-14 13:21:56.981861	8
7520055899340262711	tryfleur	\N	🌊 Bloom Hair Serum in her beach bag.	\N	2025-06-26 00:58:07	1750899487	13	412	7	2	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7520055899340262711?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocfpEy5ERSFfOpC8NgGJPQ9XQAbogmDVXGkDFB~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=62563921&x-expires=1760533200&x-signature=VH70A5Z0%2BQpdlkrEKLOcu6c11l4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.44225	2025-10-14 13:21:56.982849	8
7492901348850109738	tryfleur	\N	As a certified trichologist, I highly recommend a derm stamp for better hair. #dermastamp #trichologist #hairloss #haircare #hairgrowth #postpartum	\N	2025-04-13 20:44:45	1744577085	252	185	11	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7492901348850109738?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8EA8nkEAChAWgRt2LIADiiDEIBnDfAvYf4djS~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=c4f9693f&x-expires=1760533200&x-signature=bNWvv9uUDu1QvVfYOVLLlABdFh4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.448777	2025-10-14 13:21:56.988363	8
7133464811198876971	joshuacrowe	\N	Can this $600,000 Client Retire Today? #retirement #retirementplanning #milliondollaradvisor	\N	2022-08-19 06:06:51	1660889211	500	55	2	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7133464811198876971?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/c56814f958654a01b8ec2c2a4d2d8194~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/0eebae8336d14cf2b4004552b05529c1.jpeg?dr=8595&refresh_token=ae998aed&x-expires=1760569200&x-signature=CAFAwWqoa3UKwmEeJnaitDyOD30%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.396292	2025-10-14 23:14:42.396292	6
7492874106480725290	tryfleur	\N	Want thicker, stronger, healthier hair? #strongerhair #thickerhair #healthyhair 	\N	2025-04-13 18:58:53	1744570733	30	214	12	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7492874106480725290?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8vnfABrEDCiAD10fEAgIvAiUg81m3aSWQ5RSC~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=34f0e846&x-expires=1760533200&x-signature=nBF%2FE2wNlZ31mUwpuUncdcxihV4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.449662	2025-10-14 13:21:56.989169	8
7560427315214159117	tryfleur	\N	Bloom is a water-based, multi-peptide serum designed for daily use light-weight formula, zero residue, and made to absorb into the scalp (not coat the hair). Peptides like GHK-Cu, AHK-Cu, PAL-AHK, GHK, Zn-Thymulin, and PTD-DBM help support a healthier follicle environment by signaling cellular repair pathways and balancing the scalp micro-ecosystem. Because the formula is water-based, it absorbs quickly without the occlusive film oils can leave, so it layers cleanly under your normal routine. Use 3-5 small drops on the scalp and massage for 30-60 seconds. Consistency matters more than quantity. A temporary uptick in shedding can occur in the first few weeks as older hairs cycle out; most people notice stronger, fuller-looking strands with steady use over 3-6 months. Have questions about routines or ingredients? Drop them below. Shop directly through TikTok.  #hairgrowthtips #peptideserum #hairtok #hairthinning #bloompeptidehairserum 	\N	2025-10-12 19:59:49	1760299189	30	299	9	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7560427315214159117?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oAEARHgeqOMbA4ANge3ICdDYQkXWj2oQAeVr8C~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=986aa695&x-expires=1760533200&x-signature=wQyhdyCkhH0VLlU59vLAd2Okie0%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.389186	2025-10-14 13:21:56.923509	8
7517563988461342007	tryfleur	\N	Started in January and stoked on the results. Was on Finasteride for almost a year but the side effects were sooo bad. #malepatternbaldness #dht #PeptideSerum 	\N	2025-06-19 07:48:58	1750319338	286	526	3	4	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7517563988461342007?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMQDQpA1F6w3ICaRemfHjmSAEKkdn3pQmAfFjg~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=c709d39c&x-expires=1760533200&x-signature=NhO%2FnCEvy0aUFcX8yta4sBIN8Q8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.44509	2025-10-14 13:21:56.985384	8
7493309270025473326	tryfleur	\N	GIVEAWAY TIME Win our best-selling Hair Regrowth Duo — BLOOM Serum + Derma Stamp — for FREE How to enter: 1️⃣ Follow us @tryfleur 2️⃣ Like this video 3️⃣ Tag 2 friends in the comments (each tag = 1 entry) 4️⃣ BONUS: Repost this video + tag us for 5 extra entries What you’ll win: • BLOOM Hair Serum (peptides only — no minoxidil) • Derma Stamp (for deeper absorption) Ends May 1st at 11:59PM CST U.S. only Let’s grow that hair #BloomGiveaway #HairTok #HairGrowthTips #PeptideSerum #DermaStamp #CleanBeautyTok #HairCareGiveaway	\N	2025-04-14 23:07:31	1744672051	11	128	11	2	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7493309270025473326?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMzfD63lIA2PB3yCEMA9yBAZAIiTKJv30wdBVi~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=7f535fca&x-expires=1760533200&x-signature=JiQr5Px%2B7qFz4vp4hWjApB%2Bks1g%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.446873	2025-10-14 13:21:56.986878	8
7492941004627103018	tryfleur	\N	✨GIVEAWAY TIME✨ Win our best-selling Hair Regrowth Duo — BLOOM Serum + Derma Stamp — for FREE How to enter: 1️⃣ Follow us @tryfleur 2️⃣ Like this video 3️⃣ Tag 2 friends in the comments (each tag = 1 entry) 4️⃣ BONUS: Repost this video + tag us for 5 extra entries What you’ll win: • BLOOM Hair Serum (peptides only — no minoxidil) • Derma Stamp (for deeper absorption) Ends May 1st at 11:59PM CST U.S. only Let’s grow that hair #BloomGiveaway #HairTok #HairGrowthTips #PeptideSerum #DermaStamp #CleanBeautyTok #HairCareGiveaway	\N	2025-04-13 23:18:36	1744586316	23	234	12	17	6	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7492941004627103018?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oogyzBIzCAB0wEArE5DCBJw8BJiqIfki3AMRvA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=a9e5d425&x-expires=1760533200&x-signature=RFcEGAmxx9ks6mKfyHnhRaaYnKE%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.447917	2025-10-14 13:21:56.987597	8
7496984316115782954	tryfleur	\N	Your hair isn’t waiting for miracles—it’s waiting for instructions. Our serum uses clinical-grade peptides that talk directly to your cells, telling them to grow, strengthen, and restore. It’s not magic. It’s molecular. Ready to see what science can do for your scalp?  Visit the Shop. #FleurScience #HairGrowthJourney #PeptidePower #BioactiveBeauty #FleurResults #HairRegrowth #ScalpCare #ScienceBackedBeauty #HealthyHairStartsHere #WomenWithHairGoals #HairCareThatWorks	\N	2025-04-24 20:48:19	1745527699	76	123	11	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7496984316115782954?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oYkpSFDaVCDNjQpBDeEIsiBASI6gI0D9PofCx5~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=0617b63c&x-expires=1760533200&x-signature=CpHwmlvZ05YWZuNY8tkXXkpF64w%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.445946	2025-10-14 13:21:56.986144	8
7491065525284441386	tryfleur	\N	Our water-based peptide formula delivers potent peptides deep into your roots—no oils, no residue, just pure nourishment. Check out in our TikTok Shop 💼  #HairGrowthJourney #StrongerHair #HealthyScalp #PeptidePowered #ThickerHair #MinimalLuxury #HairWellness #FleurHair	\N	2025-04-08 22:00:40	1744149640	60	129	3	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7491065525284441386?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8AA4TEQIHAPqeffGMFk4dH9UViAzIAcDEBjAl~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=6a8bb8e5&x-expires=1760533200&x-signature=W5Hs2%2BZVx%2FXCOZioi0JsoPWVgKw%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.457151	2025-10-14 13:21:56.997217	8
7133441198030818606	joshuacrowe	\N	How I Solved a $1,000,000 Client’s Income Needs: Part 2 #retirement #retirementplanning #milliondollaradvisor	\N	2022-08-19 04:35:09	1660883709	245	37	1	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7133441198030818606?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/fa010d0ccff040349c1f0ad430664692~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/b13b342390e3412688a029df679dd3ee.jpeg?dr=8595&refresh_token=f9061173&x-expires=1760569200&x-signature=VA6ryfmDSBoAQcxafGB8DAgjLqU%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.397168	2025-10-14 23:14:42.397168	6
7121926464047467819	joshuacrowe	\N	Saving $5.8M client $4M in taxes via a Roth conversion. #rothira #roth #rothconversion #retirement	\N	2022-07-19 03:52:06	1658202726	421	99	9	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7121926464047467819?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/fda0ce64fb0045dba8328458a926f2aa_1658202729~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/b612a1c7e09f4334a75a4c75a73c3b6f.jpeg?dr=8595&refresh_token=22780602&x-expires=1760569200&x-signature=rQONUzs3%2Bg5gXUQu3uyZmiHwQEg%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.398115	2025-10-14 23:14:42.398115	6
7492567544130293034	tryfleur	\N	The most advanced hair growth serum on the market. For visibly stronger, fuller, healthier hair choose Fleur. #hairserum #haircare #peptides #ghkcu #ahkcu #ptddbm #palahk #ghkbasic #ghk 	\N	2025-04-12 23:09:23	1744499363	19	211	4	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7492567544130293034?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oEknH7jSYAy0ARmCgEiQf8SBkfux1qXiDEBj6I~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=dd598371&x-expires=1760533200&x-signature=TUta5T%2BOOxk5a3rdjP5nuFfhQ8I%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.451479	2025-10-14 13:21:56.990756	8
7492304679309987118	tryfleur	\N	Hack your hair growth cycle - check out this bioactive peptide hair serum #fleur #peptides #ghkcu #ahkcu #ptddbm #palahk #hairgrowthhCk #hairserum #haircare	\N	2025-04-12 06:09:56	1744438196	206	1305	13	3	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7492304679309987118?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oUJ6sLDiALIQAILEHBizAADBwIJmABQ7vofCR1~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=f7c6aa82&x-expires=1760533200&x-signature=ENpf0ZQK5v0sbJTjFiMyZ7nQhS8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.452362	2025-10-14 13:21:56.991482	8
7491869397254950186	tryfleur	\N	Losing my hair mid 30s, tried Finasteride but couldn’t deal with the side effects (loss of libido, depression, suicidal ideation). Been on a multi-peptide hair serum for past 3 months and it’s doing god’s work with 0 side effects - stoked!	\N	2025-04-11 01:59:59	1744336799	0	251	5	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7491869397254950186?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/0ab0b225de9342a69915ba336a449fec~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=fb847291&x-expires=1761742800&x-signature=qgTVdmBWKwoj9YRCjkRcEGRL%2B54%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&biz_tag=tt_photomode&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.453172	2025-10-14 13:21:56.992409	8
7491526828205591850	tryfleur	\N	Boost that hair growth baby! Sorry for the "umms"...l hate ummms 🤣. Also, the $76 deal is only available on our site at the moment. Sorry about that 🤗.	\N	2025-04-10 03:51:12	1744257072	111	166	7	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7491526828205591850?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8B7M8fdIQjkQFgWpAPAXEfuIgjoAAQcHHyAxf~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=bc92608e&x-expires=1760533200&x-signature=lqNLzMEM8LomR4SPDFN21IYI9rY%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.454187	2025-10-14 13:21:56.993343	8
7490402644494667050	tryfleur	\N	Definitely getting thicker…	\N	2025-04-07 03:08:24	1743995304	286	156	2	4	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7490402644494667050?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oQARIRr3GgPGkSVAAvLAkfj17EeePAHQIcAlI6~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=fab2e70c&x-expires=1760533200&x-signature=S7iipGElpNwA6V1dKoY0VWrt52w%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.45872	2025-10-14 13:21:56.997987	8
7491117459035147566	tryfleur	\N	Thinking about trying a derma stamp? Here's why it's a game-changer for hair regrowth & skin health: 1. Boosts collagen for firmer, smoother skin 2. Creates microchannels to absorb serums better (like peptides!) 3. Stimulates dormant hair follicles for visible results 4. Less invasive than microneedling rollers—more precise, less irritation 5. Perfect for targeted areas like thinning hairlines or acne scars Consistency = results. Don’t expect overnight magic, but trust the process. Hashtags: #Dermastamp #HairRegrowthJourney #Microneedling #PeptideSkincare #BeautyTok #SkinTok #HairTok #HairLossTreatment #AntiAgingTips #SkincareTools #ScalpCare #GlowUpTips #SkincareRoutine	\N	2025-04-09 01:21:51	1744161711	18	3913	17	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7491117459035147566?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oAEljADMfHBfhAfq4uupks9EACvFIIPuHQAAPS~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=fb17e9d4&x-expires=1760533200&x-signature=rYWS0eQuqbnDRykd5OX8FczUoNg%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.456236	2025-10-14 13:21:56.996437	8
7464254395975355690	tryfleur	\N	Your stories and results motivate everything we do.   #HealthyHairJourney #HairSerumMagic #PeptideHairCare #ThickerHairSolutions #HairGrowthEssentials #PeptidePower #LustrousLocks #ThinningHairSolutions #TransformYourTresses #ScalpHealthMatters #PeptideInfused #FullerHairDreams #HydrateYourHair #HairGrowthSupport #ShinyHairGoals #ThickerAndStronger #HairBoost #LoveYourHairAgain #HairSerumWorks #StrongHairStrongYou	\N	2025-01-26 16:00:11	1737907211	15	145	3	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7464254395975355690?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o0AAxWXsgiIAqrUWzZB44UPbFE05BZBoBiIEL~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=15122e79&x-expires=1760533200&x-signature=y6j3JWWMLaF1UbJZdbUdc6cfZ6c%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.466336	2025-10-14 13:21:57.005937	8
7560089166965394702	tryfleur	\N	💧 How to know if your shedding is normal — or actual hair loss: ✨ 1️⃣ Daily shedding is normal. The average scalp sheds 50–100 hairs a day. It’s part of your hair’s natural renewal cycle. 🧴 2️⃣ More shedding after wash day? Totally normal. When you go longer between brushing or washing, loose strands build up, so it looks like you’re losing more at once. 🌿 3️⃣ Starting a growth serum? Expect a “shedding phase.” When peptides reactivate dormant follicles, old hairs are pushed out to make room for stronger, thicker strands. This is a good sign your scalp is responding. 🧬 4️⃣ Watch your root bulb. If shed hairs have a tiny white bulb at the end, that’s natural shedding. If hairs break mid-shaft or have no bulb, that can indicate damage or thinning. 💆‍♀️ 5️⃣ Stress, hormones, and diet all play a role. Postpartum, nutrient changes, or chronic stress can shift more hairs into the “shedding” phase, but with consistent care, balance can be restored. 🌸 6️⃣ What helps? Focus on scalp health, gentle massaging, balanced nutrition, and using a multi-peptide serum like Bloom that strengthens follicles before they fall. ⚡ Bottom line: Some shedding = healthy renewal. Excessive shedding or visible thinning over months = time to nourish your scalp and support regrowth. #hairtok #hairthinning #hairshedding 	\N	2025-10-11 22:07:32	1760220452	8	304	4	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7560089166965394702?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocMISQXrBB1d6p6qlui3wlIiIAxZC7OfCxA0FW~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=45595aa4&x-expires=1760533200&x-signature=aW8OuOI2fTzuhRgoR9CTMzWqPC4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.390458	2025-10-14 13:21:56.924884	8
7481364881225141546	tryfleur	\N	Healthy hair starts at the root. Bloom by Fleur is powered by advanced peptides that nourish your scalp, strengthen strands, and support fuller, healthier-looking hair. Science meets self-care—because every great hair day starts beneath the surface.  #FleurPeptides #BloomWithFleur  #PeptidePoweredHair #HairSerumMagic #StrongerFullerHair #HealthyHairJourney #HairGrowthSecrets #ScalpCareMatters #LuxuryHairCare #EffortlessBeauty	\N	2025-03-13 18:36:58	1741891018	16	283	5	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7481364881225141546?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oIVS5AAIPGH7eB0mESLIAuGTIpAjwIAQIyeekk~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=a8031015&x-expires=1760533200&x-signature=bjnHhPQdGXlSto2oT1Lk1xs9xF4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.462825	2025-10-14 13:21:57.001491	8
7481036628551617838	tryfleur	\N	Like flowers, your hair thrives in cycles. The Anagen phase is where the magic happens—this is your ‘blooming’ stage. Fleur’s peptides are designed to extend this phase, so your hair stays in its prime longer. Nurture your roots, and your bloom will follow. #FleurHair #BloomingFromTheRoot #PeptidePoweredHair #HairSerumMagic #StrongerFullerHair #HealthyHairJourney #HairGrowthSecrets #ScalpCareMatters #LuxuryHairCare #EffortlessBeauty	\N	2025-03-12 21:23:28	1741814608	16	144	2	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7481036628551617838?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/okIm9jEPaojetFEW5KGD0AAIkhHfAPGAuQAcEf~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=e3db4071&x-expires=1760533200&x-signature=2UzFppOXXX4E7VU9KdRbpccLmYk%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.463751	2025-10-14 13:21:57.002346	8
7480708468903660843	tryfleur	\N	BLOOM GIVEAWAY Want thicker, healthier hair? We’re giving away a 3-Month Supply of Bloom Peptide Hair Serum to one lucky winner! How to Enter: 1️⃣ Follow @TryFleur. 2️⃣ Like this Video. 3️⃣ Share this Video to your story and tag us. 4️⃣ BONUS: Tag 2 friends in the comments (more tags = more entries!). ⏳ Giveaway ends March 31st. Winner announced in our stories.  #BloomWithFleur #PeptidePower #ThickerHair #HairGoals #FleurWithConfidence	\N	2025-03-12 00:10:04	1741738204	10	2666	162	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7480708468903660843?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oQGrJiBDICButIAtyQiEihBA0AqwNyAI6zfiuD~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=c0d83a1c&x-expires=1760533200&x-signature=KDc36faEy0GXHDY%2BmKTbjihLdnI%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.464608	2025-10-14 13:21:57.0032	8
7471068513638321454	tryfleur	\N	For hair that gets noticed—without saying a word. #HairTok #HairGrowth #TikTokMadeMeBuyIt #BeforeAndAfter #HairCareRoutine	\N	2025-02-14 00:41:45	1739493705	24	63	3	2	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7471068513638321454?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oUzzBerLGHdPLJpITdIISYIoXCkQhmOAfejgEA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=3e47fa15&x-expires=1760533200&x-signature=eVBfMvPykay64MP%2B1bHRGfxsLBw%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.465455	2025-10-14 13:21:57.004999	8
7450987571980537134	tryfleur	\N	Catch me if you can! #fullerhair #hairroutine #hairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds 	\N	2024-12-21 21:57:17	1734818237	8	235	8	2	9	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7450987571980537134?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o0iOBzhiAb2T5yZBEky4vuPt2AIBAcgn2UEiA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=74b33cd6&x-expires=1760533200&x-signature=LyCVeSiIQiq06wybkPetUHjkRR0%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.475101	2025-10-14 13:21:57.013447	8
7121921618363911466	joshuacrowe	\N	Saving a $5.8M client $4M in taxes via a Roth conversion #rothira #roth #rothconversion #retirement	\N	2022-07-19 03:33:17	1658201597	341	130	2	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7121921618363911466?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/47726ea3eaa0477b8007bb73c857bc46_1658201606~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/9812da3e9c244b28811dace1ced1c3cd.jpeg?dr=8595&refresh_token=3d1f1846&x-expires=1760569200&x-signature=syTQzXRQJzEqNkTUHrAkeYd1q2A%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.398976	2025-10-14 23:14:42.398976	6
7553402943257578765	tryfleur	\N	Strands so thick they’re jealous, thanks Bloom Peptide Hair Serum 😏💇‍♀️. Our Bloom Hair serum uses GHK-Cu Copper Peptides and five other powerful peptides to jumpstart hair growth. #peptidetherapy #hairgrowth #hairgrowthtips #ghkcupeptide #copperpeptides 	\N	2025-09-23 21:41:47	1758663707	11	422	6	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7553402943257578765?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocULISx7SDABF784GxFfDRoCbEygkBu0IMf3TE~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=8b6b3e58&x-expires=1760533200&x-signature=5GxmaxWpxj8RDLyYqsHmiGXHlno%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.415875	2025-10-14 13:21:56.955138	8
7463547304709147950	tryfleur	\N	bloom together.  #HealthyHairJourney #HairSerumMagic #PeptideHairCare #ThickerHairSolutions #HairGrowthEssentials #PeptidePower #LustrousLocks #ThinningHairSolutions #TransformYourTresses #ScalpHealthMatters #PeptideInfused #FullerHairDreams #HydrateYourHair #HairGrowthSupport #ShinyHairGoals #ThickerAndStronger #HairBoost #LoveYourHairAgain #HairSerumWorks #StrongHairStrongYou	\N	2025-01-24 18:16:25	1737742585	6	129	3	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7463547304709147950?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocEETinVeCA4DPBiIPnbASAgiF2Egk1exCxARP~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=f82da6a2&x-expires=1760533200&x-signature=i13a%2FLEinQTcdLmhomuT1uYq%2B54%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.468216	2025-10-14 13:21:57.007929	8
7463174221653396782	tryfleur	\N	bloom peptide hair serum revitalizes and strengthens hair. With advanced peptides, it nourishes the scalp, promotes healthier hair growth, and helps restore fullness and vitality.	\N	2025-01-23 18:07:52	1737655672	16	528	3	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7463174221653396782?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMweKwAvEiSvj3ABUhzCSBXByIiQJQAPwA6iCI~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=e5d42e79&x-expires=1760533200&x-signature=WFNwIczcKTvbwJgZEIRm1bF4hAM%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.469099	2025-10-14 13:21:57.008695	8
7458124564732726571	tryfleur	\N	📸 	\N	2025-01-10 03:32:29	1736479949	11	416	9	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7458124564732726571?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8MJE6ixlIpbZT7ABCBAIpw2IKzwlAaCZEiyfp~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=136b599e&x-expires=1760533200&x-signature=sqNVM3MSeNdX%2F99QiZEIKyC3cmY%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.471064	2025-10-14 13:21:57.010461	8
7451367909923802411	tryfleur	\N	What are peptides? Peptides are short chains of amino acids that serve as building blocks for proteins in the body, such as collagen and keratin. In skincare and haircare, peptides are celebrated for their ability to signal cells to repair and rejuvenate. #peptides #peptidehairserum #hairserum #haircare #fullerhair #hairroutine #hairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds #amazonhiddengem	\N	2024-12-22 22:33:12	1734906792	6	1638	14	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7451367909923802411?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oAEAozACzBEAqwIc0vIABiiBnkB2stAcyfcT6J~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=908c0fff&x-expires=1760533200&x-signature=uVLN%2F4UAS0I39obUM8Mg%2B2JFpJ8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.472921	2025-10-14 13:21:57.011951	8
7451177065581120811	tryfleur	\N	Fleur’s surgical steel grade derma stamp guarntees to improve your hair care serums results by breaking up the skin barrier to permit greater product absorption. #dermastamp #dermaroller #fullerhair #hairroutine #hairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds #amazonhiddengem	\N	2024-12-22 10:12:48	1734862368	20	187	7	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7451177065581120811?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/okkDoAyAEBBAInFAOb4An5efSZhjE2IznEHGHe~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=3972b139&x-expires=1760533200&x-signature=cNHx%2FlmwxyhS4X5P7To5836B4DE%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.473833	2025-10-14 13:21:57.012691	8
7458119197915221290	tryfleur	\N	our obsession. 	\N	2025-01-10 03:11:41	1736478701	19	163	7	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7458119197915221290?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oovGLKMwji5o7EfBIBreIeeVQHAmeQA1GcHMA7~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=fc50b7dd&x-expires=1760533200&x-signature=oqV4dyZjBlYbDaBqbnllHSkDWC8%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.472006	2025-10-14 13:21:57.011214	8
7447594977946963246	tryfleur	\N	Multi-Peptide Hair Growth Serum for Women Who Define Elegance & Confidence. #hairserum #growthserum #peptide #scalpserum #hairtok	\N	2024-12-12 18:32:19	1734028339	28	127	5	2	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7447594977946963246?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8BnEbZBi7JL4MAAAACAsUgEJzsvB1itk4IDY~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=25745ca9&x-expires=1760533200&x-signature=%2BROAuJKakTGY2kSQJwxQ3GjD4Ek%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.480239	2025-10-14 13:21:57.018485	8
7447291125293157678	tryfleur	\N	Living ingredients to help stimulate, strengthen, repair, and support your haor journey.	\N	2024-12-11 22:53:11	1733957591	40	878	9	3	10	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7447291125293157678?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o0AwFCYxDIB9ea8fAZFAkOjWVEf1OAHEEqAjIt~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=7693566b&x-expires=1760533200&x-signature=2G84QiqHueoJrCE%2FH21f0mjjAFA%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.481003	2025-10-14 13:21:57.019514	8
7444433503699111210	tryfleur	\N	www.tryfleur.com 	\N	2024-12-04 06:04:10	1733292250	7	268	3	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7444433503699111210?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oUihaiREEDAfNI9PAnVgcTy3SBihd8TBfYoOL0~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=8f9660c8&x-expires=1760533200&x-signature=L5A7PiTBLS2Q5XiHQqKLvljsPLw%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.482457	2025-10-14 13:21:57.021104	8
7120795997906734382	joshuacrowe	\N	$300,000 Annuity Review and Comprison #annuity #annuityspecialist #retirement	\N	2022-07-16 02:45:17	1657939517	460	107	2	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7120795997906734382?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/8ce6e03154534064b22c275f267182ba~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/27b63f40f46e4f378da7dca2c9325270.jpeg?dr=8595&refresh_token=d862d799&x-expires=1760569200&x-signature=JeuhKJV%2BSA6Qw6%2FEMYbMWpW%2BQNM%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.399905	2025-10-14 23:14:42.399905	6
7449187181978979630	tryfleur	\N	Our 90-Day Haircare Challenge Guarantees amazing results like:                                                                               Fuller & Denser Hair – formulated with powerful ingredients that stimulate hair growth to increase the appearance of fuller, denser, more voluminous hair. Stronger & Thicker Hair – developed with advanced peptides to strengthen and broaden the hair shaft, enhancing the look of stronger, thicker hair. Nourished & Balanced Scalp – supports a healthy scalp environment by reducing build-up, soothing, hydrating, and restoring scalp balance.                                                      #shinyhair #shinyhairroutine #shinyhairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds #amazonhiddengem	\N	2024-12-17 01:30:50	1734399050	30	148	3	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7449187181978979630?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocfqqNQSYBDFEkiIBQEMu9ACg9MgJnewDERBE7~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=ecd7a480&x-expires=1760533200&x-signature=k1J8lupLiZOmitWi8FBlw4yWC68%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.477845	2025-10-14 13:21:57.016044	8
7449125544135871787	tryfleur	\N	Take the 90-Day Haircare Challenge with Our Buy 2 Get 1 Free Holiday Promo! #90daychallenge #haircare #hairregrowth #shinyhair #shinyhairroutine #shinyhairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds #amazonhiddengem	\N	2024-12-16 21:31:52	1734384712	43	223	4	1	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7449125544135871787?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8BRgnApAoiWEhWACEEkSuiAI2gv2ZBdAZB4c~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/oIRgrowIiiBAsJWiEpBiBzn4wABBICAAEME6fG.jpeg?dr=8595&refresh_token=9c3afae8&x-expires=1760533200&x-signature=ZkP0PPy20UXLWtQaAf2HfLZ5W%2Bo%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.478682	2025-10-14 13:21:57.016884	8
7448850234651872558	tryfleur	\N	Looking for fuller, stronger, healthier hair? #shinyhair #shinyhairroutine #shinyhairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds #amazonhiddengem	\N	2024-12-16 03:43:19	1734320599	9	194	4	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7448850234651872558?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oYB1DR4fRnEVaSD3B3DfSFF64dZXgAqIaVorQE~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=bf5f0258&x-expires=1760533200&x-signature=5fgJn9BL0vLy9FyyjxibzZUpkXo%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.479452	2025-10-14 13:21:57.017661	8
7446594232124673326	tryfleur	\N	We’re truly inspired by the incredible feedback from our customers. Your stories and results motivate everything we do! #peptidehaircare #peptide #hair #hairserum 	\N	2024-12-10 01:48:52	1733795332	13	518	2	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7446594232124673326?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ogi8gAozqAPEBVBAi2p8BInBJNXfIS2ACS6wEB~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=2808ec0c&x-expires=1760533200&x-signature=L9nvsDECNB9urQz%2BslzUs7hSYk4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.481707	2025-10-14 13:21:57.020334	8
7444427381688831274	tryfleur	\N	🤷‍♀️	\N	2024-12-04 05:40:27	1733290827	8	264	3	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7444427381688831274?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocAAPilkWTu0B6WnRf1BfqE2gSitDdrIEnsYEI~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=effd2fc5&x-expires=1760533200&x-signature=fqlLdBSYltR85TA5kA8SeT4pKTk%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.485259	2025-10-14 13:21:57.021822	8
7120793168311766315	joshuacrowe	\N		\N	2022-07-16 02:34:19	1657938859	420	92	6	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7120793168311766315?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/725b967786fe4e8cb4db661186b0b707_1657938876~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/d9194e45dc6c431ea490aa1a3507fe13.jpeg?dr=8595&refresh_token=7b743301&x-expires=1760569200&x-signature=XNaazFVzx8ZRcIRkUSiES2m6IMk%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.400914	2025-10-14 23:14:42.400914	6
7558985563248823607	tryfleur	\N	I used to be so insecure about my natural hair. Watching it thin out year after year was honestly heartbreaking. I tried everything, from thick oils to scalp scrubs, but nothing seemed to make a lasting difference. Then I found Bloom, a water-based, multi-peptide serum made for daily use; no residue, no buildup, just clean nourishment that actually absorbs into your scalp instead of coating your hair. It’s packed with powerful peptides like GHK-Cu, AHK-Cu, PAL-AHK, GHK, Zn-Thymulin, and PTD-DBM that work beneath the surface to support healthier follicles, repair at the cellular level, and restore balance to your scalp ecosystem. Because it’s water-based, it absorbs quickly and layers seamlessly under my normal hair routine; no heaviness, no greasy film. I just use 3–5 drops a day, massaging it into my scalp for about 30 seconds. Consistency is key. Within a few weeks, I noticed some light shedding as old hairs cycled out, but after sticking with it, my strands became stronger, thicker, and fuller-looking. It genuinely brought my confidence back. If you’ve been struggling with thinning or shedding, start simple — Bloom truly changed my hair from the root up. 🌿✨ Have questions? Drop them below, or shop directly through TikTok Shop to start your own growth journey. #hairtransformation #hairgrowth #hairtok #bloompeptidehairserum #hairthinning 	\N	2025-10-08 22:44:58	1759963498	8	338	5	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7558985563248823607?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMPeIkED5JfHL2yD6RcmI5HIWqFLNjAzf3CSDA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=d8a6c7cd&x-expires=1760533200&x-signature=2Cq2y0VaNR8SCxbX8sH7cXOL3G4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.394551	2025-10-14 13:21:56.929577	8
7557522530441923854	tryfleur	\N	Healthy, thriving hair starts at the root. Our Peptide Hair Formula Bloom restores scalp health and supports stronger, thicker, healthier hair-without the irritation or side-effects. Your best hair is waiting. Shop Bloom directly through TikTok Shop.  #hairtok #hairthinning #hairgrowth #peptideserum #hairgrowthserum 	\N	2025-10-05 00:07:42	1759622862	19	358	5	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7557522530441923854?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ogfBh2bABBAi7kw39YBQp0IscEStqtIpNiWCLy~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=fb537f55&x-expires=1760533200&x-signature=SIcO2P6nQ51iCxV%2BSwU3%2Bqy0Qt4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.400662	2025-10-14 13:21:56.936565	8
7120792272450489643	joshuacrowe	\N	$300,000 Annuity Review and Comparison #annuity #annuityspecialist #retirement	\N	2022-07-16 02:30:51	1657938651	420	81	2	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@milliondollaradvisor/video/7120792272450489643?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/0af4686bbd5d478cafc59a215f0ca08f_1657938680~tplv-tiktokx-dmt-logoccm:300:400:tos-useast5-i-0068-tx/80a5dcf3d3df41a6a83811bbac2ac553.jpeg?dr=8595&refresh_token=096aed74&x-expires=1760569200&x-signature=KHoS2bBsLD0wiB1qcJZnkchhNeM%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 23:14:42.401785	2025-10-14 23:14:42.401785	6
7554174500896541965	tryfleur	\N	Peptides. Science. Real results. Discover what Fleur is all about. #peptide #ghkcu #ghkcuhairgrowth #copperpeptides #haircareserum 	\N	2025-09-25 23:35:25	1758843325	14	358	5	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7554174500896541965?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oIZXo6fYGQ23urHKAvLNkZjpfCeBRIHQIqAkIq~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=7be8773a&x-expires=1760533200&x-signature=fJD%2BzSR8O%2B1ndA6mYp%2Bgimfk8n4%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.412771	2025-10-14 13:21:56.952091	8
7551520199334235447	tryfleur	\N	The truth about luxury hair serums is most provide a temporary superficial benefit without fixing the root problem.  Our bloom peptide hair serum uses hair science and Korean based chemist to curated a unique blend of six powerful peptides including GHK-CU peptides that have been shown to support hair growth and restoring hair density. #peptide #ghkcu #ghkcupeptide #multipeptideserum #copperpeptides 	\N	2025-09-18 19:55:23	1758225323	5	376	5	3	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7551520199334235447?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocKfQQkjaIuMCODoHOAFsm1aQfxFRfECKFc7YA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=e2679520&x-expires=1760533200&x-signature=Z8nYPIQ6dLTw6Ngu7te%2BtyViK70%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.418549	2025-10-14 13:21:56.959523	8
7549253781486112014	tryfleur	\N	Where ritual meets refinement, Bloom deserves a place on every vanity ✨ #luxuryhaircare #luxuryhair #haircareserum 	\N	2025-09-12 17:20:57	1757697657	14	298	5	1	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7549253781486112014?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oYejMQAagDRNfNIPgCIMmkWKUioqrH8KifAUt9~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=0b790d7b&x-expires=1760533200&x-signature=eaQFBahza19zumgxtNCFg8itrpU%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.42833	2025-10-14 13:21:56.968964	8
7549182471049334029	tryfleur	\N	The cosmos is clearing space: old doubts, old stories, now gone. Let your self-care ritual bloom into truth. ✨ #pisceslunareclipse2025 #astrology #selfgrowth #selfcare 	\N	2025-09-12 12:44:26	1757681066	10	394	23	3	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7549182471049334029?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oMPBnuiIIBw0nRYfFFipEvzIqaoDLCAhBAgIK9~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=43260b1b&x-expires=1760533200&x-signature=wdu9KdGrvznBnjn%2Fr0KyRzqwr7U%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.429243	2025-10-14 13:21:56.969689	8
7517574206784146743	tryfleur	\N	Thicker, longer, healthier hair starts at the root, and to get to the root you need to penetrate the skin barrier. But the skin barrier is tough, it’s literal job is to keep things out. So you need something super small, small enough to squeeze through the tightly woven skin cells and liposomal putty that sits atop your head and holds everything together. That’s where peptides come in. Peptides are extremely small molecules capable of making it through that tough skin barrier. Once these little guys get past the outer skin layer they make their way to the hair bulb, basically your hair manufacture - and this is where the real magic happens. These friendly peptides are able to communicate with your cells, they send friendly little messages. Messages like “hey you, wake your sleepy butt up and start growing”, or “you look a little thin, let’s thicken you up, get some blood flowing here you’re starving”. Each peptide plays a different role, but they all work together for the same goal, to grow beautiful, long, lushes, and thick hair. Peptides are our friends :) #hairtok #hairgrowth #peptideserum #ghk #ahk #palahk #ghkbasic #ptddbm #znthymulin 	\N	2025-06-19 08:29:43	1750321783	206	1708	16	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7517574206784146743?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oM5IepBi5LxaACk66QvhjeA9TIQjeHgGQnlPGM~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=3c5b505f&x-expires=1760533200&x-signature=i5sACXUEX9B1BLnIc5RchiT3c5o%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.443172	2025-10-14 13:21:56.983762	8
7492704865827835179	tryfleur	\N	Using my derma stamp to help with absorption of my hair serum. #dermastamp #dermaroller #haircare #hairtok #hairhack #hairstyle #hairtutorial #hair 	\N	2025-04-13 08:03:15	1744531395	23	301	10	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7492704865827835179?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oomncLxMAAAxARU5gEiQfGSBjfV0PMgiDECD8I~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=bfa708e1&x-expires=1760533200&x-signature=QIbyNGODAO9Fb%2FzHSUyDprpqJZk%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.450524	2025-10-14 13:21:56.989963	8
7491129211466403115	tryfleur	\N	What makes our peptide hair serum different? Here’s the science in simple terms: 1. Peptides = signaling proteins that tell your follicles to wake up 2. Boosts blood flow + nutrients to the scalp 3. Helps extend the hair growth cycle (aka more growth, less shedding) 4. Lightweight, non-greasy formula—no buildup or residue 5. Backed by real results, not just hype Made for women. Rooted in science. Built with purpose.  #PeptideHairSerum #HairRegrowth #HairTok #HairCareRoutine #ScalpCare #WomensHairLoss #PeptidesForHair #BeautyTok #ThinningHairHelp #HairGrowthJourney #TryFleur #BeforeAndAfterHair #HairCareTips #HealthyHairStartsHere	\N	2025-04-09 02:07:28	1744164448	63	285	6	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7491129211466403115?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/okeALCiulhBARmgYscAAi81DfxSADnIE1qEv9V~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=38cea527&x-expires=1760533200&x-signature=KjQLMRgxTs1tQ8TQye8%2BHCs190Q%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.455191	2025-10-14 13:21:56.995509	8
7489523638685732139	tryfleur	\N	Peptides are your body's natural messengers, supporting keratin and collagen for stronger, healthier hair. Your body already relies on them—now let’s put them to work. tryfleur.com for more education and hair tips. #HairGrowthJourney #StrongerHair #HealthyScalp #PeptidePowered #ThickerHair #MinimalLuxury #HairWellness #FleurHair	\N	2025-04-04 18:17:39	1743790659	17	413	6	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7489523638685732139?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocGSITJIACKAHDBdBAwihfk6EvILzQiBRAi3wA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=2614a4c6&x-expires=1760533200&x-signature=qKqkzAkiMrGVl%2BvACGupDG%2FvCKM%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.459688	2025-10-14 13:21:56.998839	8
7482495636198198570	tryfleur	\N	Not all hair growth solutions are created equal. While biotin and minoxidil have been around for years, peptides are the future of hair health—stimulating follicles at the root for stronger, thicker, healthier hair. 🌱 Unlike harsh ingredients that may cause irritation or dependency, peptides work with your body to repair and rejuvenate from within. 💡 Why settle? Upgrade your routine with Fleur Peptide Hair Formula. 🖤 Visit the TT shop to start your hair journey now. #FleurHair #PeptideScience #HealthyHair #HairGrowth #MinimalLuxury #FleurFormula	\N	2025-03-16 19:45:13	1742154313	0	175	2	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7482495636198198570?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-i-photomode-tx/1d9fbaec2dbe4317a101db9a48a3f057~tplv-photomode-image-cover:640:0:q70.webp?dr=12229&refresh_token=8c51848e&x-expires=1761742800&x-signature=NStzPx6QEzbp4dbQSEfH82NDdTY%3D&t=5897f7ec&ps=d5b8ac02&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&biz_tag=tt_photomode&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.46171	2025-10-14 13:21:57.000537	8
7450056466565827882	tryfleur	\N	Because every strand tells your story—stronger, fuller, radiant. Rewrite your hair’s destiny, one drop at a time with hair by Fleur. #shinyhair #shinyhairroutine #shinyhairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds #amazonhiddengem	\N	2024-12-19 09:44:24	1734601464	24	157	6	0	2	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7450056466565827882?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oAAA4EejOHAG6YReADE1BCcxFAtEkIfj1ImhjX~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=9211ce82&x-expires=1760533200&x-signature=IGNFnHVeamIjwtXp0t7EX29uC8A%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&s=TIKTOK_FOR_DEVELOPER&sc=cover&biz_tag=tt_video	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.476968	2025-10-14 13:21:57.015134	8
7550331433114520887	tryfleur	\N	No one really warns you about the postpartum hair loss that can happen. For me, it wasn’t just about thinning hair, it felt like I was losing pieces of myself. Every strand on my pillow was a reminder, and little by little my confidence started slipping away. Postpartum already brings so many changes, and watching my hair fall out made me feel powerless. It’s not just hair, it’s how you see yourself, how you feel when you look in the mirror, and how you show up in the world. That loss can truly affect your happiness. Then I found Bloom, our multi peptide serum for hair density, and it completely changed my journey. I started applying this hair care serum directly to my scalp and damp hair, and slowly I noticed the difference, fuller strands, stronger roots, new growth, and most importantly, my confidence coming back. This peptide hair serum gave me back my perfect hair ritual. It’s more than just a serum for hair, it’s self-care that actually heals. Now, every time I use Bloom, it feels like I’m giving myself permission to bloom on the outside and the inside. 🌸 Bloom multi peptide serum for hair density is available now on TikTok Shop if you’re ready to let your crown bloom too. ✨ #perfecthairserum ##multipeptideserum##haircareserums##hairtok##postpartumjourney	\N	2025-09-15 15:02:59	1757948579	13	202	7	3	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7550331433114520887?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/owBSIqfRCdVB0iaCC40AAEpjiZIBKI0wIAzFRw~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=711a8a46&x-expires=1760533200&x-signature=elER%2BEp079ND1Ih4OgfWj9E%2Fn8o%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&sc=cover&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.423795	2025-10-14 13:21:56.964995	8
7459521915577814318	tryfleur	\N	How celebrities grow stronger, fuller, healthier hair. #hair #hairtok #hairlossprevention #hairgrowthtips #hairlosssolution #fullerhair #hairroutine #hairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds #amazonhiddengem	\N	2025-01-13 21:54:59	1736805299	118	490	18	0	0	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7459521915577814318?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/o8yLIySRbELYeuDAD5gFkh78EfiJnUEBpAhiFA~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=f0a6248f&x-expires=1760533200&x-signature=j%2BSe2X%2F5f7DCe4udL07LasUQwBw%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.470107	2025-10-14 13:21:57.00948	8
7450326629714496814	tryfleur	\N	You want great hair? #greathair #fullerhair #haircare #hairserum #shinyhair #shinyhairroutine #shinyhairproducts #healthyhair #healthyhairjourney #hairhealthjourney #hairglossing #hairserum #amazonhairfinds #amazonhiddengem 	\N	2024-12-20 03:12:29	1734664349	138	587	8	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7450326629714496814?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/oQnZBns4IAOiCYYEEbAkWDA1ARFJtSff6gADCE~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=c2cded55&x-expires=1760533200&x-signature=0aHmgJ5QsGJ72pwldtMOM8bkpLw%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.476036	2025-10-14 13:21:57.014318	8
7444426970118589738	tryfleur	\N	At Fleur, Bloom represents more than just a product; it’s the cornerstone of our commitment to transforming hair care. Bloom Peptide Hair Formula is expertly crafted using advanced multi-peptide technology to target thinning hair at its root. This innovative formula supports hair strength, encourages fullness, and revitalizes scalp health, delivering visible, lasting results. With Bloom, we combine science-backed solutions with premium ingredients to give you a hair care experience that not only addresses thinning but also restores confidence. Designed for those seeking healthier, thicker, and more resilient hair, Bloom is the next step in hair care	\N	2024-12-04 05:38:52	1733290732	9	297	3	0	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7444426970118589738?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/ocuEDT1S6IAfyArcwP6VPfAudgi0yCBBnEaRAi~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=a451cde7&x-expires=1760533200&x-signature=1ek8brpLV7gsue2OZgoHJ39NxDQ%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.486015	2025-10-14 13:21:57.022768	8
7548532157291957518	tryfleur	\N	Looking for the perfect product for your aesthetic vanity? 🤎 Bloom Peptide Hair Serum is crafted in luxury glass, blending timeless design with advanced hair science. Powered by GHK-Cu and a blend of six premium peptides, it supports the look of fuller, healthier-feeling strands, making it a refined ritual for those navigating hair thinning and seeking the appearance of regrowth ✨  #peptide #hairtok #ghkcu #peptidetherapy #peptideserum 	\N	2025-09-10 18:40:35	1757529635	8	162	5	3	1	\N	\N	\N	\N	\N	\N	https://www.tiktok.com/@tryfleur/video/7548532157291957518?utm_campaign=tt4d_open_api&utm_source=sbawwh1dm7gfd76x5h	\N	https://p16-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/owJ3WeBBIEJEXE1DcxoEBDiBwIb6ScmfgAaFLR~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg?dr=8596&refresh_token=0073029b&x-expires=1760533200&x-signature=WloidPz5ktjwFsP8YJKSvtTz%2B4s%3D&t=bacd0480&ps=933b5bde&shp=d05b14bd&shcp=8aecc5ac&idc=useast5&biz_tag=tt_video&s=TIKTOK_FOR_DEVELOPER&sc=cover	\N	\N	\N	\N	\N	\N	f	2025-10-14 13:17:14.433504	2025-10-14 13:21:56.973571	8
\.


--
-- Name: job_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tiktok_user
--

SELECT pg_catalog.setval('public.job_status_id_seq', 1, false);


--
-- Name: user_oauth_states_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tiktok_user
--

SELECT pg_catalog.setval('public.user_oauth_states_id_seq', 43, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tiktok_user
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: video_ai_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tiktok_user
--

SELECT pg_catalog.setval('public.video_ai_analysis_id_seq', 75, true);


--
-- Name: video_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tiktok_user
--

SELECT pg_catalog.setval('public.video_snapshots_id_seq', 224, true);


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
-- Name: video_snapshots video_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_snapshots
    ADD CONSTRAINT video_snapshots_pkey PRIMARY KEY (id);


--
-- Name: video_snapshots video_snapshots_video_id_snapshot_date_key; Type: CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_snapshots
    ADD CONSTRAINT video_snapshots_video_id_snapshot_date_key UNIQUE (video_id, snapshot_date);


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
-- Name: idx_video_snapshots_date; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_snapshots_date ON public.video_snapshots USING btree (snapshot_date);


--
-- Name: idx_video_snapshots_user_date; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_snapshots_user_date ON public.video_snapshots USING btree (user_id, snapshot_date);


--
-- Name: idx_video_snapshots_video_date; Type: INDEX; Schema: public; Owner: tiktok_user
--

CREATE INDEX idx_video_snapshots_video_date ON public.video_snapshots USING btree (video_id, snapshot_date);


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
-- Name: video_snapshots video_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.video_snapshots
    ADD CONSTRAINT video_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: videos videos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tiktok_user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict IQQbz4bHRsejyT3zcYdPcB3fNbQ0ygW2JBfAu5J1nCoLC4d3llkdu9vs0q8oRbR

