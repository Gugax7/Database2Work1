-- Exact table definitions copied from BD I, used ONLY by the guarded local tests.
CREATE TABLE IF NOT EXISTS "artefato" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "material_id" INTEGER DEFAULT NULL,
  "PoderEspecial" TEXT,
  "IsAmaldicoado" SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "artefato_tipo" (
  "id" BIGSERIAL PRIMARY KEY,
  "artefato_id" INTEGER NOT NULL,
  "Tipo" VARCHAR(50) NOT NULL,
  CONSTRAINT "UQ_Artefato_Tipo" UNIQUE ("artefato_id", "Tipo")
);

CREATE TABLE IF NOT EXISTS "aventura" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "AnoInicio" INTEGER NOT NULL,
  "Objetivo" TEXT NOT NULL,
  "Status" VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
  "Duracao" VARCHAR(50) DEFAULT NULL,
  "local_id" INTEGER NOT NULL,
  CONSTRAINT "aventura_chk_1" CHECK ("Status" IN ('Em Andamento','Concluida','Fracassada','Pendente'))
);

CREATE TABLE IF NOT EXISTS "batalha" (
  "id" BIGSERIAL PRIMARY KEY,
  "NomeBatalha" VARCHAR(100) NOT NULL UNIQUE,
  "ResultadoGeral" VARCHAR(100) DEFAULT NULL,
  "DataInicio" DATE DEFAULT NULL,
  "DataFim" DATE DEFAULT NULL,
  "aventura_id" INTEGER NOT NULL,
  CONSTRAINT "CHK_Datas_Batalha" CHECK (("DataFim" IS NULL) OR ("DataFim" >= "DataInicio"))
);

CREATE TABLE IF NOT EXISTS "batalha_ser" (
  "id" BIGSERIAL PRIMARY KEY,
  "batalha_id" INTEGER NOT NULL,
  "ser_id" INTEGER NOT NULL,
  CONSTRAINT "UQ_Batalha_Ser" UNIQUE ("batalha_id", "ser_id")
);

CREATE TABLE IF NOT EXISTS "deus" (
  "ser_id" INTEGER PRIMARY KEY,
  "Reino" VARCHAR(100) DEFAULT NULL,
  "DominioDivino" VARCHAR(100) NOT NULL,
  "Epiteto" VARCHAR(100) DEFAULT NULL,
  "Simbolo" VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "forja" (
  "id" BIGSERIAL PRIMARY KEY,
  "artefato_id" INTEGER NOT NULL,
  "material_id" INTEGER NOT NULL,
  "forjador_ser_id" INTEGER NOT NULL,
  CONSTRAINT "UQ_Forja" UNIQUE ("artefato_id", "material_id", "forjador_ser_id")
);

CREATE TABLE IF NOT EXISTS "heroi" (
  "ser_id" INTEGER PRIMARY KEY,
  "Motivacao" TEXT,
  "Mentor" VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "local" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL,
  "RegiaoGeografica" VARCHAR(100) NOT NULL,
  "DeusPertencente" VARCHAR(100) DEFAULT NULL,
  "Tipo" VARCHAR(50) NOT NULL,
  CONSTRAINT "UQ_Local" UNIQUE ("Nome", "RegiaoGeografica")
);

CREATE TABLE IF NOT EXISTS "maldicao" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "Severidade" VARCHAR(50) DEFAULT NULL,
  "DeusQueLancou" VARCHAR(100) NOT NULL,
  "CondicaoEncerramento" TEXT,
  CONSTRAINT "maldicao_chk_1" CHECK ("Severidade" IN ('Leve','Moderada','Grave','Devastadora'))
);

CREATE TABLE IF NOT EXISTS "material" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "OrigemMitica" VARCHAR(100) DEFAULT NULL,
  "Dureza" INTEGER DEFAULT NULL,
  "CaracteristicaEspecial" TEXT,
  CONSTRAINT "material_chk_1" CHECK ("Dureza" > 0)
);

CREATE TABLE IF NOT EXISTS "metamorfose" (
  "id" BIGSERIAL PRIMARY KEY,
  "ser_id" INTEGER NOT NULL,
  "FormaAssumida" VARCHAR(100) NOT NULL,
  "Motivo" TEXT,
  "IsReversivel" SMALLINT NOT NULL DEFAULT 1,
  "ContextoMitico" VARCHAR(255) NOT NULL,
  CONSTRAINT "UQ_Metamorfose" UNIQUE ("ser_id", "ContextoMitico")
);

CREATE TABLE IF NOT EXISTS "monstro" (
  "ser_id" INTEGER PRIMARY KEY,
  "RegiaoDeHabitacao" VARCHAR(100) DEFAULT NULL,
  "GrauDePerigo" INTEGER DEFAULT NULL,
  "Categoria" VARCHAR(50) DEFAULT NULL,
  CONSTRAINT "monstro_chk_1" CHECK ("GrauDePerigo" BETWEEN 1 AND 10)
);

CREATE TABLE IF NOT EXISTS "mortal" (
  "ser_id" INTEGER PRIMARY KEY,
  "Ocupacao" VARCHAR(100) DEFAULT NULL,
  "DataNasc" DATE DEFAULT NULL,
  "CidadeOrigem" VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "oraculo" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "Localizacao" VARCHAR(150) NOT NULL,
  "MetodoConsulta" VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "poder" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "Intensidade" INTEGER DEFAULT NULL,
  "Origem" VARCHAR(100) DEFAULT NULL,
  CONSTRAINT "poder_chk_1" CHECK ("Intensidade" BETWEEN 1 AND 10)
);

CREATE TABLE IF NOT EXISTS "poder_ser" (
  "id" BIGSERIAL PRIMARY KEY,
  "ser_id" INTEGER NOT NULL,
  "poder_id" INTEGER NOT NULL,
  "NivelDominio" INTEGER DEFAULT NULL,
  CONSTRAINT "UQ_Poder_Ser" UNIQUE ("ser_id", "poder_id"),
  CONSTRAINT "poder_ser_chk_1" CHECK ("NivelDominio" BETWEEN 1 AND 10)
);

CREATE TABLE IF NOT EXISTS "poder_tipo" (
  "id" BIGSERIAL PRIMARY KEY,
  "poder_id" INTEGER NOT NULL,
  "Tipo" VARCHAR(50) NOT NULL,
  CONSTRAINT "UQ_Poder_Tipo" UNIQUE ("poder_id", "Tipo")
);

CREATE TABLE IF NOT EXISTS "profecia" (
  "id" BIGSERIAL PRIMARY KEY,
  "oraculo_id" INTEGER NOT NULL,
  "DataEnunciado" DATE NOT NULL,
  "DescricaoCurta" TEXT NOT NULL,
  "Estado" VARCHAR(50) NOT NULL DEFAULT 'Pendente',
  CONSTRAINT "UQ_Profecia" UNIQUE ("oraculo_id", "DataEnunciado"),
  CONSTRAINT "profecia_chk_1" CHECK ("Estado" IN ('Pendente','Cumprida','Parcialmente Cumprida','Anulada'))
);

CREATE TABLE IF NOT EXISTS "profecia_aventura" (
  "id" BIGSERIAL PRIMARY KEY,
  "profecia_id" INTEGER NOT NULL,
  "aventura_id" INTEGER NOT NULL,
  CONSTRAINT "UQ_Profecia_Aventura" UNIQUE ("profecia_id", "aventura_id")
);

CREATE TABLE IF NOT EXISTS "profecia_ser" (
  "id" BIGSERIAL PRIMARY KEY,
  "profecia_id" INTEGER NOT NULL,
  "ser_id" INTEGER NOT NULL,
  CONSTRAINT "UQ_Profecia_Ser" UNIQUE ("profecia_id", "ser_id")
);

CREATE TABLE IF NOT EXISTS "semideus" (
  "ser_id" INTEGER PRIMARY KEY,
  "deus_ser_id" INTEGER NOT NULL,
  "mortal_ser_id" INTEGER NOT NULL,
  "HabilidadeEspecial" TEXT
);

CREATE TABLE IF NOT EXISTS "ser" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "EstadoVital" VARCHAR(50) NOT NULL DEFAULT 'Vivo',
  "Alinhamento" VARCHAR(50) DEFAULT NULL,
  "Categoria" VARCHAR(50) NOT NULL,
  CONSTRAINT "ser_chk_1" CHECK ("EstadoVital" IN ('Vivo','Morto','Imortal','Desconhecido'))
);

CREATE TABLE IF NOT EXISTS "ser_aventura" (
  "id" BIGSERIAL PRIMARY KEY,
  "ser_id" INTEGER NOT NULL,
  "aventura_id" INTEGER NOT NULL,
  "SerMorreu" SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT "UQ_Ser_Aventura" UNIQUE ("ser_id", "aventura_id")
);

CREATE TABLE IF NOT EXISTS "ser_maldicao" (
  "id" BIGSERIAL PRIMARY KEY,
  "maldicao_id" INTEGER NOT NULL,
  "ser_id" INTEGER NOT NULL,
  "FoiQuebrada" SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT "UQ_Ser_Maldicao" UNIQUE ("maldicao_id", "ser_id")
);

CREATE TABLE IF NOT EXISTS "tita" (
  "ser_id" INTEGER PRIMARY KEY,
  "Genero" VARCHAR(20) DEFAULT NULL,
  "DominioPrimordial" VARCHAR(100) DEFAULT NULL,
  "Geracao" INTEGER DEFAULT NULL,
  CONSTRAINT "tita_chk_1" CHECK ("Geracao" > 0)
);

CREATE TABLE IF NOT EXISTS "vilao" (
  "ser_id" INTEGER PRIMARY KEY,
  "ObjetivoMaligno" TEXT NOT NULL,
  "NivelAmeaca" INTEGER DEFAULT NULL,
  CONSTRAINT "vilao_chk_1" CHECK ("NivelAmeaca" BETWEEN 1 AND 10)
);
