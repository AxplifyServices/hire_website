CREATE TABLE IF NOT EXISTS news (
    id_news VARCHAR(11) PRIMARY KEY,
    id_agence VARCHAR(11) NOT NULL,
    date_parution DATE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    date_creation DATE NOT NULL DEFAULT CURRENT_DATE,
    date_dern_maj DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_news_agence
        FOREIGN KEY (id_agence)
        REFERENCES agences(id_agence)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_news_date_parution
    ON news(date_parution DESC);

CREATE INDEX IF NOT EXISTS idx_news_id_agence
    ON news(id_agence);

CREATE INDEX IF NOT EXISTS idx_news_agence_date
    ON news(id_agence, date_parution DESC);