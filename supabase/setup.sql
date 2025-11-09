-- PRIORITÉ 1: Setup Supabase pour demain matin
-- Exécuter dans Supabase SQL Editor

-- 1. Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Table utilisateurs (priorité absolue)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  avatar TEXT,
  level VARCHAR(20) DEFAULT 'BEGINNER' CHECK (level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER')),
  elo INTEGER DEFAULT 1500 CHECK (elo >= 0),
  subscription_type VARCHAR(20) DEFAULT 'FREE' CHECK (subscription_type IN ('FREE', 'PREMIUM', 'VIP')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false
);

-- 3. Table parties (priorité absolue)
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  white_player UUID REFERENCES users(id) ON DELETE SET NULL,
  black_player UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'PLAYING', 'FINISHED', 'ABORTED')),
  board_state TEXT NOT NULL DEFAULT '4HPwATDgc/ABMA',
  game_mode VARCHAR(20) DEFAULT 'AI_VS_PLAYER' CHECK (game_mode IN ('AI_VS_PLAYER', 'PLAYER_VS_PLAYER', 'TOURNAMENT')),
  current_player VARCHAR(10) DEFAULT 'white' CHECK (current_player IN ('white', 'black')),
  dice INTEGER[] DEFAULT '{}',
  white_score INTEGER DEFAULT 0,
  black_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  winner VARCHAR(10) CHECK (winner IN ('white', 'black', 'draw'))
);

-- 4. Index pour performance (priorité haute)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_players ON games(white_player, black_player);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- 5. RLS (Row Level Security) - Priorité sécurité
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS basiques
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Users can create games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own games" ON games FOR UPDATE USING (white_player = auth.uid() OR black_player = auth.uid());

-- 7. Fonction pour créer un utilisateur (priorité inscription)
CREATE OR REPLACE FUNCTION create_user(email TEXT, password TEXT, username TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  INSERT INTO users (email, password, username)
  VALUES (email, password, username)
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction pour créer une partie (priorité jeu)
CREATE OR REPLACE FUNCTION create_game(white_player UUID, game_mode TEXT DEFAULT 'AI_VS_PLAYER')
RETURNS UUID AS $$
DECLARE
  game_id UUID;
BEGIN
  INSERT INTO games (white_player, game_mode, status)
  VALUES (white_player, game_mode, 'PLAYING')
  RETURNING id INTO game_id;
  
  RETURN game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Utilisateur démo pour tests (priorité demain matin)
INSERT INTO users (email, password, username, elo, subscription_type)
VALUES ('demo@gammonguru.com', 'demo123', 'DemoPlayer', 1650, 'PREMIUM')
ON CONFLICT (email) DO NOTHING;

-- 10. Vue pour statistiques (priorité dashboard)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.username,
  u.elo,
  COUNT(g.id) as games_played,
  COUNT(CASE WHEN g.winner = 'white' AND g.white_player = u.id THEN 1 END) as wins,
  COUNT(CASE WHEN g.winner = 'black' AND g.black_player = u.id THEN 1 END) as black_wins,
  ROUND(
    CASE 
      WHEN COUNT(g.id) > 0 THEN 
        (COUNT(CASE WHEN g.winner = 'white' AND g.white_player = u.id THEN 1 END) + 
         COUNT(CASE WHEN g.winner = 'black' AND g.black_player = u.id THEN 1 END))::FLOAT / COUNT(g.id) 
      ELSE 0 
    END, 3
  ) as win_rate
FROM users u
LEFT JOIN games g ON (g.white_player = u.id OR g.black_player = u.id) AND g.status = 'FINISHED'
GROUP BY u.id, u.username, u.elo;

-- Setup terminé pour demain matin !
SELECT 'Supabase setup completed - Ready for production!' as status;
