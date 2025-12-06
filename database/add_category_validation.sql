-- ============================================
-- ADICIONAR VALIDAÇÃO DE CATEGORIAS
-- ============================================
-- Este script adiciona uma constraint para garantir
-- que apenas categorias válidas sejam aceitas
-- ============================================

-- PASSO 1: Primeiro, normalizar todas as categorias existentes
UPDATE events
SET category = CASE
    WHEN LOWER(TRIM(category)) IN ('music', 'música', 'musica') THEN 'Música'
    WHEN LOWER(TRIM(category)) IN ('food', 'lifestyle', 'comida', 'comida & lifestyle') THEN 'Comida & Lifestyle'
    WHEN LOWER(TRIM(category)) IN ('culture', 'art', 'arte', 'cultura', 'cultura & arte') THEN 'Cultura & Arte'
    WHEN LOWER(TRIM(category)) IN ('conference', 'business', 'conferência', 'conferencia', 'negócios', 'negocios', 'conferência & negócios') THEN 'Conferência & Negócios'
    WHEN LOWER(TRIM(category)) IN ('university', 'universitário', 'universitario') THEN 'Universitário'
    WHEN LOWER(TRIM(category)) IN ('sport', 'sports', 'desporto') THEN 'Desporto'
    WHEN LOWER(TRIM(category)) IN ('theater', 'theatre', 'teatro') THEN 'Teatro'
    WHEN LOWER(TRIM(category)) IN ('party', 'festa') THEN 'Festa'
    WHEN LOWER(TRIM(category)) IN ('festival') THEN 'Festival'
    WHEN LOWER(TRIM(category)) IN ('workshop') THEN 'Workshop'
    ELSE 'Outro'
END
WHERE category IS NOT NULL;

-- PASSO 2: Remover constraint antiga se existir
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;

-- PASSO 3: Adicionar constraint com categorias válidas (em português)
ALTER TABLE events
ADD CONSTRAINT events_category_check
CHECK (category IN (
    'Música',
    'Comida & Lifestyle',
    'Cultura & Arte',
    'Conferência & Negócios',
    'Universitário',
    'Desporto',
    'Teatro',
    'Festa',
    'Festival',
    'Workshop',
    'Outro'
));

-- PASSO 4: Garantir que category não pode ser NULL
ALTER TABLE events
ALTER COLUMN category SET NOT NULL;

-- PASSO 5: Adicionar valor default
ALTER TABLE events
ALTER COLUMN category SET DEFAULT 'Outro';

-- PASSO 6: Verificar categorias finais
SELECT
    '=== CATEGORIAS NORMALIZADAS ===' as status,
    category,
    COUNT(*) as total_eventos
FROM events
GROUP BY category
ORDER BY total_eventos DESC;

-- ============================================
-- SUCESSO!
-- ============================================
-- Agora o banco de dados só aceita categorias válidas em português.
-- Tentativas de inserir "music", "conference", etc. serão rejeitadas.
--
-- Categorias aceitas:
-- - Música
-- - Comida & Lifestyle
-- - Cultura & Arte
-- - Conferência & Negócios
-- - Universitário
-- - Desporto
-- - Teatro
-- - Festa
-- - Festival
-- - Workshop
-- - Outro
-- ============================================
