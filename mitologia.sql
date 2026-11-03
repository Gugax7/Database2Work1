-- PostgreSQL dump of mitologia database
-- Converted from MySQL dialect

-- Clean up existing tables (CASCADE removes foreign key dependencies automatically if any exist)
DROP TABLE IF EXISTS "artefato" CASCADE;
DROP TABLE IF EXISTS "artefato_tipo" CASCADE;
DROP TABLE IF EXISTS "aventura" CASCADE;
DROP TABLE IF EXISTS "batalha" CASCADE;
DROP TABLE IF EXISTS "batalha_ser" CASCADE;
DROP TABLE IF EXISTS "deus" CASCADE;
DROP TABLE IF EXISTS "forja" CASCADE;
DROP TABLE IF EXISTS "heroi" CASCADE;
DROP TABLE IF EXISTS "local" CASCADE;
DROP TABLE IF EXISTS "maldicao" CASCADE;
DROP TABLE IF EXISTS "material" CASCADE;
DROP TABLE IF EXISTS "metamorfose" CASCADE;
DROP TABLE IF EXISTS "monstro" CASCADE;
DROP TABLE IF EXISTS "mortal" CASCADE;
DROP TABLE IF EXISTS "oraculo" CASCADE;
DROP TABLE IF EXISTS "poder" CASCADE;
DROP TABLE IF EXISTS "poder_ser" CASCADE;
DROP TABLE IF EXISTS "poder_tipo" CASCADE;
DROP TABLE IF EXISTS "profecia" CASCADE;
DROP TABLE IF EXISTS "profecia_aventura" CASCADE;
DROP TABLE IF EXISTS "profecia_ser" CASCADE;
DROP TABLE IF EXISTS "semideus" CASCADE;
DROP TABLE IF EXISTS "ser" CASCADE;
DROP TABLE IF EXISTS "ser_aventura" CASCADE;
DROP TABLE IF EXISTS "ser_maldicao" CASCADE;
DROP TABLE IF EXISTS "tita" CASCADE;
DROP TABLE IF EXISTS "vilao" CASCADE;

-- 
-- Table structures and data
--

CREATE TABLE "artefato" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "material_id" INTEGER DEFAULT NULL,
  "PoderEspecial" TEXT,
  "IsAmaldicoado" SMALLINT NOT NULL DEFAULT 0
);
INSERT INTO "artefato" VALUES 
(1,'Raio Mestre',1,'Destruição total por trovão',0),
(2,'Tridente de Poseidon',1,'Gera terremotos e tsunamis',0),
(3,'Elmo das Sombras',2,'Concede invisibilidade total',0),
(4,'Escudo Égide',6,'Causa pânico nos inimigos',0),
(5,'Arco de Apolo',3,'Flechas infecciosas guiadas',0),
(6,'Velo de Ouro',3,'Cura terras e doenças',0),
(7,'Sandálias Aladas',1,'Permite voo rápido',0),
(8,'Espada de Dâmocles',2,'Corta qualquer superfície',1),
(9,'Caixa de Pandora',4,'Guarda os males do mundo',1),
(10,'Fio de Ariadne',5,'Encontra saídas de qualquer lugar',0);


CREATE TABLE "artefato_tipo" (
  "id" BIGSERIAL PRIMARY KEY,
  "artefato_id" INTEGER NOT NULL,
  "Tipo" VARCHAR(50) NOT NULL,
  CONSTRAINT "UQ_Artefato_Tipo" UNIQUE ("artefato_id", "Tipo")
);
INSERT INTO "artefato_tipo" VALUES 
(1,1,'Arma Divina'),(2,2,'Arma Divina'),(3,3,'Armadura/Acessório'),(4,9,'Relíquia'),(5,10,'Ferramenta');


CREATE TABLE "aventura" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "AnoInicio" INTEGER NOT NULL,
  "Objetivo" TEXT NOT NULL,
  "Status" VARCHAR(50) NOT NULL DEFAULT 'Em Andamento',
  "Duracao" VARCHAR(50) DEFAULT NULL,
  "local_id" INTEGER NOT NULL,
  CONSTRAINT "aventura_chk_1" CHECK ("Status" IN ('Em Andamento','Concluida','Fracassada','Pendente'))
);
INSERT INTO "aventura" VALUES 
(1,'Os 12 Trabalhos',-1250,'Expiação dos crimes de Hércules','Concluida','12 anos',3),
(2,'A Saga do Velo de Ouro',-1300,'Recuperar o manto dourado sagrado','Concluida','3 anos',5),
(3,'A Guerra de Troia',-1194,'Resgatar Helena e tomar Troia','Concluida','10 anos',6),
(4,'A Odisseia',-1184,'Retorno de Odisseus para Ítaca','Concluida','10 anos',2),
(5,'Derrota do Minotauro',-1260,'Fim do sacrifício de jovens atenienses','Concluida','1 mês',9),
(6,'A Caça ao Leão de Nemeia',-1255,'Derrotar a fera invulnerável','Concluida','1 semana',3),
(7,'A Busca da Cabeça da Medusa',-1280,'Obter a cabeça do monstro','Concluida','6 meses',10),
(8,'Guerra contra os Titãs',-2000,'Tomar o controle do Cosmos','Concluida','10 anos',1),
(9,'A Libertação de Prometeu',-1240,'Salvar o Titã do castigo no Cáucaso','Concluida','2 dias',8),
(10,'Descida ao Submundo por Orfeu',-1270,'Resgatar Eurídice dos mortos','Fracassada','3 dias',2);


CREATE TABLE "batalha" (
  "id" BIGSERIAL PRIMARY KEY,
  "NomeBatalha" VARCHAR(100) NOT NULL UNIQUE,
  "ResultadoGeral" VARCHAR(100) DEFAULT NULL,
  "DataInicio" DATE DEFAULT NULL,
  "DataFim" DATE DEFAULT NULL,
  "aventura_id" INTEGER NOT NULL,
  CONSTRAINT "CHK_Datas_Batalha" CHECK (("DataFim" IS NULL) OR ("DataFim" >= "DataInicio"))
);
INSERT INTO "batalha" VALUES 
(1,'Queda de Troia','Vitória dos Gregos','1185-05-01','1185-05-10',3),
(2,'Confronto no Labirinto','Morte do Minotauro','1260-06-01','1260-06-01',5),
(3,'Duelo contra a Hidra','Vitória de Hércules','1250-03-10','1250-03-12',1),
(4,'Derrota da Medusa','Morte da Medusa','1280-08-14','1280-08-14',7),
(5,'Clash dos Titãs','Vitória dos Olimpianos','1990-01-01','2000-01-01',8),
(6,'Batalha da Cólquida','Obtenção do Velo','1300-09-01','1300-09-05',2),
(7,'Confronto com os Ciclopes','Fuga de Odisseus','1184-02-01','1184-02-02',4),
(8,'Emboscada no Pântano','Derrota dos monstros','1254-04-10','1254-04-11',6),
(9,'Cerco no Cáucaso','Libertação do Titã','1240-10-10','1240-10-10',9),
(10,'Desafio do Submundo','Perda da alma','1270-12-01','1270-12-03',10);


CREATE TABLE "batalha_ser" (
  "id" BIGSERIAL PRIMARY KEY,
  "batalha_id" INTEGER NOT NULL,
  "ser_id" INTEGER NOT NULL,
  CONSTRAINT "UQ_Batalha_Ser" UNIQUE ("batalha_id", "ser_id")
);
INSERT INTO "batalha_ser" VALUES (1,1,10),(5,2,9),(2,3,7),(3,4,8),(4,4,12);


CREATE TABLE "deus" (
  "ser_id" INTEGER PRIMARY KEY,
  "Reino" VARCHAR(100) DEFAULT NULL,
  "DominioDivino" VARCHAR(100) NOT NULL,
  "Epiteto" VARCHAR(100) DEFAULT NULL,
  "Simbolo" VARCHAR(100) DEFAULT NULL
);
INSERT INTO "deus" VALUES 
(1,'Olimpo','Céus e Trovões','Pai dos Deuses','Raio'),
(2,'Mares','Oceanos e Terremotos','O Sacudidor da Terra','Tridente'),
(3,'Submundo','Mortos e Riquezas','O Invisível','Elmo'),
(4,'Olimpo','Sabedoria e Guerra Estratégica','Deusa de OlhosAzentados','Coruja'),
(5,'Olimpo','Luz, Música e Profecias','O Resplandecente','Lira'),
(6,'Olimpo','Guerra Sangrenta e Violência','O Destruidor','Lança'),
(17,'Florestas','Caça e Lua','A Caçadora Castanheira','Arco e Flecha'),
(18,'Vulcões','Forja e Fogo','O Artífice','Martelo'),
(21,'Olimpo','Casamento e Família','Rainha dos Deuses','Pavão'),
(22,'Olimpo','Amor e Beleza','Nascida da Espuma','Concha'),
(51,'Mares','Proteção marítima e águas','A Nereida','Concha Marinha'),
(52,'Olimpo','Poesia épica e eloquência','A de Bela Voz','Tabuleta de Escrita');


CREATE TABLE "forja" (
  "id" BIGSERIAL PRIMARY KEY,
  "artefato_id" INTEGER NOT NULL,
  "material_id" INTEGER NOT NULL,
  "forjador_ser_id" INTEGER NOT NULL,
  CONSTRAINT "UQ_Forja" UNIQUE ("artefato_id", "material_id", "forjador_ser_id")
);
INSERT INTO "forja" VALUES (1,1,1,18),(2,2,1,18),(3,3,2,18),(4,4,6,18),(5,5,3,18);


CREATE TABLE "heroi" (
  "ser_id" INTEGER PRIMARY KEY,
  "Motivacao" TEXT,
  "Mentor" VARCHAR(100) DEFAULT NULL
);
INSERT INTO "heroi" VALUES 
(7,'Redimir-se dos assassinatos cometidos sob loucura','Quíron'),
(8,'Salvar sua mãe Dânae do rei Polidectes','Atena'),
(9,'Libertar sua cidade dos sacrifícios humanos','Quíron'),
(10,'Retornar para sua esposa Penélope em Ítaca','Atena'),
(11,'Reivindicar o trono de Iolcos','Quíron'),
(19,'Alcançar glória eterna na história','Quíron'),
(45,'Resgatar Eurídice do reino dos mortos','Apolo'),
(46,'Provar seu valor derrotando a Quimera','Atena'),
(48,'Conduzir os sobreviventes de Troia a uma nova terra','Afrodite'),
(50,'Permanecer ao lado do irmão mortal Castor','Hermes');


CREATE TABLE "local" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL,
  "RegiaoGeografica" VARCHAR(100) NOT NULL,
  "DeusPertencente" VARCHAR(100) DEFAULT NULL,
  "Tipo" VARCHAR(50) NOT NULL,
  CONSTRAINT "UQ_Local" UNIQUE ("Nome", "RegiaoGeografica")
);
INSERT INTO "local" VALUES 
(1,'Monte Olimpo','Tessália','Hera','Montanha Sagrada'),
(2,'Submundo','Averno','Perséfone','Reino dos Mortos'),
(3,'Esparta','Peloponeso','Ártemis','Cidade-Estado'),
(4,'Atenas','Ática','Atena','Cidade-Estado'),
(5,'Creta','Mar Egeu','Reia','Ilha'),
(6,'Troia','Anatólia','Afrodite','Cidade Fortificada'),
(7,'Delfos','Fócida','Gaia','Santuário'),
(8,'Monte Ida','Creta','Reia','Montanha'),
(9,'Labirinto de Creta','Gnosis','Nenhuma','Prisão/Construção'),
(10,'Serifos','Cíclades','Nenhuma','Ilha');


CREATE TABLE "maldicao" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "Severidade" VARCHAR(50) DEFAULT NULL,
  "DeusQueLancou" VARCHAR(100) NOT NULL,
  "CondicaoEncerramento" TEXT,
  CONSTRAINT "maldicao_chk_1" CHECK ("Severidade" IN ('Leve','Moderada','Grave','Devastadora'))
);
INSERT INTO "maldicao" VALUES 
(1,'Toque de Midas','Moderada','Dionísio','Lavar-se no rio Pactolo'),
(2,'Castigo de Sísifo','Devastadora','Hades','Rolar a pedra até o topo (Inalcançável)'),
(3,'Fome de Erisictão','Devastadora','Deméter','Consumir o próprio corpo'),
(4,'Olhar da Medusa','Grave','Atena','Morte do possuidor'),
(5,'Fome Eternizada de Tântalo','Grave','Zeus','Nenhuma (Eterna)'),
(6,'Caixa de Pandora','Devastadora','Zeus','Fechamento da caixa mantendo a Esperança'),
(7,'Cegueira de Tirésias','Moderada','Hera','Concessão do dom da profecia'),
(8,'Transformação de Aracne','Leve','Atena','Tecer teias eternamente como aranha'),
(9,'Suplício de Prometeu','Devastadora','Zeus','Libertação por um herói (Hércules)'),
(10,'Loucura de Hércules','Grave','Hera','Cumprimento dos 12 Trabalhos');


CREATE TABLE "material" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "OrigemMitica" VARCHAR(100) DEFAULT NULL,
  "Dureza" INTEGER DEFAULT NULL,
  "CaracteristicaEspecial" TEXT,
  CONSTRAINT "material_chk_1" CHECK ("Dureza" > 0)
);
INSERT INTO "material" VALUES 
(1,'Bronze Celestial','Mágia Olimpiciana',9,'Dano amplificado em monstros e imortais'),
(2,'Ferro Estígio','Rio Estige',10,'Absorve a essência das almas'),
(3,'Ouro Imperial','Roma/Grécia Antiga',8,'Conduz energia divina'),
(4,'Diamante Adamantino','Tártaro',10,'Inquebrável por armas mortais'),
(5,'Prata da Lua','Caça de Ártemis',7,'Eficaz contra criaturas da noite'),
(6,'Pele do Leão de Nemeia','Nemeia',9,'Impenetrável por lâminas'),
(7,'Madeira de Carvalho de Dodona','Floresta Sagrada',5,'Pode falar e dar profecias'),
(8,'Osso de Dragão','Cólquida',8,'Invoca guerreiros semeados'),
(9,'Escama de Hidra','Pântano de Lerna',6,'Veneno corrosivo ao contato'),
(10,'Cristal Olimpiano','Monte Olimpo',7,'Armazena luz solar pura');


CREATE TABLE "metamorfose" (
  "id" BIGSERIAL PRIMARY KEY,
  "ser_id" INTEGER NOT NULL,
  "FormaAssumida" VARCHAR(100) NOT NULL,
  "Motivo" TEXT,
  "IsReversivel" SMALLINT NOT NULL DEFAULT 1,
  "ContextoMitico" VARCHAR(255) NOT NULL,
  CONSTRAINT "UQ_Metamorfose" UNIQUE ("ser_id", "ContextoMitico")
);
INSERT INTO "metamorfose" VALUES 
(1,1,'Touro branco','Raptar Europa',1,'Travessia do mar de Tiro até Creta'),
(2,1,'Cisne','Aproximar-se de Leda',1,'Origem de Helena e Pólux'),
(3,1,'Chuva de ouro','Alcançar a princesa na torre',1,'Concepção de Perseu em Argos'),
(4,1,'Águia','Levar Ganimedes ao Olimpo',1,'Escolha do copeiro dos deuses'),
(5,1,'Sátiro','Aproximar-se de Antíope',1,'Origem dos gêmeos tebanos'),
(6,2,'Garanhão','Perseguir a deusa da colheita',1,'Perseguição pelas planícies da Arcádia'),
(7,4,'Anciã tecelã','Advertir a tecelã mortal soberba',1,'Disputa de tecelagem em Hípaipa'),
(8,21,'Anciã mendiga','Testar a hospitalidade dos mortais',1,'Disfarce recorrente em suas provações'),
(9,22,'Peixe','Escapar do ataque de Tífon',1,'Fuga às margens do Eufrates'),
(10,6,'Javali','Matar Adônis sem ser reconhecido',1,'Ciúme pelo favorecido de Afrodite');


CREATE TABLE "monstro" (
  "ser_id" INTEGER PRIMARY KEY,
  "RegiaoDeHabitacao" VARCHAR(100) DEFAULT NULL,
  "GrauDePerigo" INTEGER DEFAULT NULL,
  "Categoria" VARCHAR(50) DEFAULT NULL,
  CONSTRAINT "monstro_chk_1" CHECK ("GrauDePerigo" BETWEEN 1 AND 10)
);
INSERT INTO "monstro" VALUES 
(12,'Caverna das Gorgonas',9,'Górgona'),(13,'Labirinto de Creta',8,'Híbrido'),
(14,'Pântano de Lerna',10,'Serpente'),(38,'Vale de Nemeia',8,'Fera'),
(39,'Ilha dos Ciclopes',7,'Ciclope'),(40,'Portões do Submundo',9,'Cão Infernal'),
(41,'Montanhas da Lícia',9,'Híbrido'),(42,'Estrada de Tebas',8,'Híbrido'),
(43,'Estreito de Messina',9,'Aberração Marinha'),(44,'Ilhas Estrófades',5,'Híbrido');


CREATE TABLE "mortal" (
  "ser_id" INTEGER PRIMARY KEY,
  "Ocupacao" VARCHAR(100) DEFAULT NULL,
  "DataNasc" DATE DEFAULT NULL,
  "CidadeOrigem" VARCHAR(100) DEFAULT NULL
);
INSERT INTO "mortal" VALUES 
(10,'Rei de Ítaca','1210-05-10','Ítaca'),(11,'Líder dos Argonautas','1320-03-12','Iolcos'),
(20,'Rei de Creta','1300-01-01','Creta'),(31,'Rei da Trácia','1290-03-30','Pimpleia'),
(32,'Rainha de Corinto','1295-08-17','Corinto'),(33,'Rainha de Esparta','1250-06-08','Esparta'),
(34,'Princesa da Tessália','1275-11-02','Lárissa'),(35,'Pastor da casa real troiana','1230-09-14','Troia'),
(36,'Rei de Serifos','1315-06-20','Serifos'),(37,'Rei de Iolcos','1340-04-25','Iolcos'),
(53,'Princesa de Micenas','1285-02-10','Micenas'),(54,'Princesa de Argos','1320-07-15','Argos'),
(55,'Princesa de Trezena','1295-09-18','Trezena'),(56,'Rei dos Mirmidões','1275-04-12','Ftia'),
(57,'Rei da Frígia','1100-03-05','Frígia'),(58,'Primeira mulher mortal','1600-01-01','Grécia');


CREATE TABLE "oraculo" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "Localizacao" VARCHAR(150) NOT NULL,
  "MetodoConsulta" VARCHAR(100) DEFAULT NULL
);
INSERT INTO "oraculo" VALUES 
(1,'Oráculo de Delfos','Fócida','Transe da Pitonisa sobre vapores'),
(2,'Oráculo de Dodona','Epiro','Interpretação do sussurro das folhas de carvalho'),
(3,'Oráculo de Trofônio','Beócia','Descida a uma caverna subterrânea'),
(4,'Oráculo de Claros','Jônia','Inspecção de água de fonte sagrada'),
(5,'Oráculo de Dídima','Muleto','Inspiração por água de nascente'),
(6,'Oráculo de Anfiarao','Oropo','Incubação e sonhos em pele de carneiro'),
(7,'Oráculo de Cumai','Campânia','Folhas escritas pela Sibila'),
(8,'Oráculo de Siwa','Líbia','Consultas ao deus Amon-Rá/Zênus'),
(9,'Oráculo de Delos','Ilha de Delos','Sacerdotes leitores de presságios'),
(10,'Oráculo de Olímpia','Élis','Empirromancia (exame de oferendas queimadas)');


CREATE TABLE "poder" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "Intensidade" INTEGER DEFAULT NULL,
  "Origem" VARCHAR(100) DEFAULT NULL,
  CONSTRAINT "poder_chk_1" CHECK ("Intensidade" BETWEEN 1 AND 10)
);
INSERT INTO "poder" VALUES 
(1,'Raio Divino',10,'Divina'),(2,'Controle dos Mares',10,'Divina'),
(3,'Invisibilidade do Elmo',8,'Mágica/Artefato'),(4,'Petrificação',9,'Monstruosa'),
(5,'Metamorfose Divina',8,'Divina'),(6,'Necromancia',9,'Subterrânea'),
(7,'Fogo Prometeico',9,'Titanica'),(8,'Superforça Heráclea',8,'Semidivina'),
(9,'Voo Alado',6,'Mágica/Artefato'),(10,'Profecia Infalível',7,'Mística');


CREATE TABLE "poder_ser" (
  "id" BIGSERIAL PRIMARY KEY,
  "ser_id" INTEGER NOT NULL,
  "poder_id" INTEGER NOT NULL,
  "NivelDominio" INTEGER DEFAULT NULL,
  CONSTRAINT "UQ_Poder_Ser" UNIQUE ("ser_id", "poder_id"),
  CONSTRAINT "poder_ser_chk_1" CHECK ("NivelDominio" BETWEEN 1 AND 10)
);
INSERT INTO "poder_ser" VALUES (1,1,1,10),(2,2,2,10),(3,3,3,9),(4,12,4,10),(5,7,8,9);


CREATE TABLE "poder_tipo" (
  "id" BIGSERIAL PRIMARY KEY,
  "poder_id" INTEGER NOT NULL,
  "Tipo" VARCHAR(50) NOT NULL,
  CONSTRAINT "UQ_Poder_Tipo" UNIQUE ("poder_id", "Tipo")
);
INSERT INTO "poder_tipo" VALUES (1,1,'Elemental'),(2,1,'Ofensivo'),(3,2,'Elemental'),(4,4,'Maldição'),(5,6,'Mágico');


CREATE TABLE "profecia" (
  "id" BIGSERIAL PRIMARY KEY,
  "oraculo_id" INTEGER NOT NULL,
  "DataEnunciado" DATE NOT NULL,
  "DescricaoCurta" TEXT NOT NULL,
  "Estado" VARCHAR(50) NOT NULL DEFAULT 'Pendente',
  CONSTRAINT "UQ_Profecia" UNIQUE ("oraculo_id", "DataEnunciado"),
  CONSTRAINT "profecia_chk_1" CHECK ("Estado" IN ('Pendente','Cumprida','Parcialmente Cumprida','Anulada'))
);
INSERT INTO "profecia" VALUES 
(1,1,'0500-01-10','O filho de Édipo matará o pai e casará com a mãe','Cumprida'),
(2,1,'0480-05-12','A cabeça da Górgona cairá diante do filho de Zeus','Cumprida'),
(3,2,'0600-03-20','O herói com um só calçado quebrará o reinado de Pélias','Cumprida'),
(4,7,'0450-08-15','A queda da grande cidade virá do interior de um cavalo','Cumprida'),
(5,1,'0700-11-01','O semideus morrerá pelas vestes do centauro','Cumprida'),
(6,3,'0520-02-14','O rei que olhar o sol ao meio-dia perderá o reino','Parcialmente Cumprida'),
(7,5,'0410-09-09','O grande imperador destruirá um grande império ao cruzar o rio','Cumprida'),
(8,8,'0331-04-01','O filho de Zeus libertará o Titã acorrentado','Cumprida'),
(9,9,'0550-06-30','A peste só cessará quando o sacrifício for aceito','Pendente'),
(10,10,'0490-10-10','A vitória virá nas planícies correndo contra o tempo','Cumprida');


CREATE TABLE "profecia_aventura" (
  "id" BIGSERIAL PRIMARY KEY,
  "profecia_id" INTEGER NOT NULL,
  "aventura_id" INTEGER NOT NULL,
  CONSTRAINT "UQ_Profecia_Aventura" UNIQUE ("profecia_id", "aventura_id")
);
INSERT INTO "profecia_aventura" VALUES (1,2,7),(2,3,2),(3,4,3),(4,5,1),(5,8,9);


CREATE TABLE "profecia_ser" (
  "id" BIGSERIAL PRIMARY KEY,
  "profecia_id" INTEGER NOT NULL,
  "ser_id" INTEGER NOT NULL,
  CONSTRAINT "UQ_Profecia_Ser" UNIQUE ("profecia_id", "ser_id")
);
INSERT INTO "profecia_ser" VALUES (1,2,8),(2,3,11),(3,4,10),(4,5,7),(5,8,7);


CREATE TABLE "semideus" (
  "ser_id" INTEGER PRIMARY KEY,
  "deus_ser_id" INTEGER NOT NULL,
  "mortal_ser_id" INTEGER NOT NULL,
  "HabilidadeEspecial" TEXT
);
INSERT INTO "semideus" VALUES 
(7,1,53,'Força Titânica'),(8,1,54,'Agilidade Divina'),(9,2,55,'Domínio das águas'),
(19,51,56,'Invulnerabilidade corporal'),(45,52,31,'Música que encanta homens, feras e mortos'),
(46,2,32,'Domínio sobre cavalos alados'),(47,1,33,'Beleza capaz de mover exércitos'),
(48,22,35,'Proteção divina em combate'),(49,5,34,'Cura e ressurreição dos mortos'),
(50,1,33,'Imortalidade compartilhada e punho invencível');


CREATE TABLE "ser" (
  "id" BIGSERIAL PRIMARY KEY,
  "Nome" VARCHAR(100) NOT NULL UNIQUE,
  "EstadoVital" VARCHAR(50) NOT NULL DEFAULT 'Vivo',
  "Alinhamento" VARCHAR(50) DEFAULT NULL,
  "Categoria" VARCHAR(50) NOT NULL,
  CONSTRAINT "ser_chk_1" CHECK ("EstadoVital" IN ('Vivo','Morto','Imortal','Desconhecido'))
);
INSERT INTO "ser" VALUES 
(1,'Zeus','Imortal','Neutro','Deus'),(2,'Poseidon','Imortal','Neutro','Deus'),
(3,'Hades','Imortal','Neutro','Deus'),(4,'Atena','Imortal','Bom','Deus'),
(5,'Apolo','Imortal','Bom','Deus'),(6,'Ares','Imortal','Caótico','Deus'),
(7,'Hércules','Vivo','Bom','Semideus'),(8,'Perseu','Vivo','Bom','Semideus'),
(9,'Teseu','Vivo','Bom','Semideus'),(10,'Odisseus','Vivo','Bom','Mortal'),
(11,'Jasão','Vivo','Bom','Mortal'),(12,'Medusa','Morto','Maligno','Monstro'),
(13,'Minotauro','Morto','Maligno','Monstro'),(14,'Hidra de Lerna','Morto','Maligno','Monstro'),
(15,'Cronos','Imortal','Maligno','Titã'),(16,'Oceano','Imortal','Neutro','Titã'),
(17,'Ártemis','Imortal','Bom','Deus'),(18,'Hefesto','Imortal','Neutro','Deus'),
(19,'Aquiles','Morto','Neutro','Semideus'),(20,'Rei Minos','Morto','Maligno','Mortal'),
(21,'Hera','Imortal','Neutro','Deus'),(22,'Afrodite','Imortal','Neutro','Deus'),
(23,'Gaia','Imortal','Neutro','Titã'),(24,'Reia','Imortal','Bom','Titã'),
(25,'Hipérion','Imortal','Neutro','Titã'),(26,'Jápeto','Imortal','Neutro','Titã'),
(27,'Têmis','Imortal','Bom','Titã'),(28,'Mnemosine','Imortal','Neutro','Titã'),
(29,'Prometeu','Imortal','Bom','Titã'),(30,'Atlas','Imortal','Neutro','Titã'),
(31,'Oeagro','Morto','Neutro','Mortal'),(32,'Eurínome','Morto','Bom','Mortal'),
(33,'Leda','Morto','Neutro','Mortal'),(34,'Corônis','Morto','Neutro','Mortal'),
(35,'Anquises','Morto','Neutro','Mortal'),(36,'Polidectes','Morto','Maligno','Mortal'),
(37,'Pélias','Morto','Maligno','Mortal'),(38,'Leão de Nemeia','Morto','Maligno','Monstro'),
(39,'Polifemo','Vivo','Maligno','Monstro'),(40,'Cérbero','Imortal','Neutro','Monstro'),
(41,'Quimera','Morto','Maligno','Monstro'),(42,'Esfinge','Morto','Maligno','Monstro'),
(43,'Cila','Vivo','Maligno','Monstro'),(44,'Harpia Aelo','Vivo','Maligno','Monstro'),
(45,'Orfeu','Morto','Bom','Semideus'),(46,'Belerofonte','Morto','Bom','Semideus'),
(47,'Helena','Morto','Neutro','Semideus'),(48,'Eneias','Morto','Bom','Semideus'),
(49,'Asclépio','Imortal','Bom','Semideus'),(50,'Pólux','Imortal','Bom','Semideus'),
(51,'Tétis','Imortal','Bom','Deus'),(52,'Calíope','Imortal','Bom','Deus'),
(53,'Alcmena','Morto','Bom','Mortal'),(54,'Dânae','Morto','Bom','Mortal'),
(55,'Etra','Morto','Bom','Mortal'),(56,'Peleu','Morto','Bom','Mortal'),
(57,'Midas','Morto','Neutro','Mortal'),(58,'Pandora','Morto','Neutro','Mortal');


CREATE TABLE "ser_aventura" (
  "id" BIGSERIAL PRIMARY KEY,
  "ser_id" INTEGER NOT NULL,
  "aventura_id" INTEGER NOT NULL,
  "SerMorreu" SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT "UQ_Ser_Aventura" UNIQUE ("ser_id", "aventura_id")
);
INSERT INTO "ser_aventura" VALUES (1,7,1,0),(2,11,2,0),(3,10,3,0),(4,12,7,1),(5,13,5,1);


CREATE TABLE "ser_maldicao" (
  "id" BIGSERIAL PRIMARY KEY,
  "maldicao_id" INTEGER NOT NULL,
  "ser_id" INTEGER NOT NULL,
  "FoiQuebrada" SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT "UQ_Ser_Maldicao" UNIQUE ("maldicao_id", "ser_id")
);
INSERT INTO "ser_maldicao" VALUES (1,10,7,1),(2,4,12,0),(3,9,29,1),(4,1,57,1),(5,6,58,0);


CREATE TABLE "tita" (
  "ser_id" INTEGER PRIMARY KEY,
  "Genero" VARCHAR(20) DEFAULT NULL,
  "DominioPrimordial" VARCHAR(100) DEFAULT NULL,
  "Geracao" INTEGER DEFAULT NULL,
  CONSTRAINT "tita_chk_1" CHECK ("Geracao" > 0)
);
INSERT INTO "tita" VALUES 
(15,'Masculino','Tempo e Agricultura',1),(16,'Masculino','Águas Primordiais',1),
(23,'Feminino','Terra Primordial',1),(24,'Feminino','Fertilidade e Maternidade',1),
(25,'Masculino','Luz Celestial',1),(26,'Masculino','Mortalidade e Ofício',1),
(27,'Feminino','Justiça e Ordem Divina',1),(28,'Feminino','Memória e Linguagem',1),
(29,'Masculino','Previdência e Fogo',2),(30,'Masculino','Resistência e Firmamento',2);


CREATE TABLE "vilao" (
  "ser_id" INTEGER PRIMARY KEY,
  "ObjetivoMaligno" TEXT NOT NULL,
  "NivelAmeaca" INTEGER DEFAULT NULL,
  CONSTRAINT "vilao_chk_1" CHECK ("NivelAmeaca" BETWEEN 1 AND 10)
);
INSERT INTO "vilao" VALUES 
(12,'Petrificar qualquer um que invadir seu domínio',8),
(13,'Devorar humanos sacrificados',7),
(14,'Envenenar as fontes e devorar o gado de Lerna',9),
(15,'Devorar os próprios filhos e governar com tirania',10),
(20,'Manter o domínio sobre Atenas através do medo',6),
(36,'Afastar Perseu para tomar sua mãe à força',6),
(37,'Manter o trono de Iolcos usurpado de Jasão',7),
(39,'Devorar os marinheiros que aportarem em sua ilha',7),
(41,'Incendiar as terras e os rebanhos da Lícia',8),
(42,'Estrangular todos os que errarem o enigma',8);

-- Note: Because we inserted IDs manually, we need to update the sequence generators 
-- for the BIGSERIAL primary keys so future INSERTs without an ID won't fail.
SELECT setval('"artefato_id_seq"', (SELECT MAX("id") FROM "artefato"));
SELECT setval('"artefato_tipo_id_seq"', (SELECT MAX("id") FROM "artefato_tipo"));
SELECT setval('"aventura_id_seq"', (SELECT MAX("id") FROM "aventura"));
SELECT setval('"batalha_id_seq"', (SELECT MAX("id") FROM "batalha"));
SELECT setval('"batalha_ser_id_seq"', (SELECT MAX("id") FROM "batalha_ser"));
SELECT setval('"forja_id_seq"', (SELECT MAX("id") FROM "forja"));
SELECT setval('"local_id_seq"', (SELECT MAX("id") FROM "local"));
SELECT setval('"maldicao_id_seq"', (SELECT MAX("id") FROM "maldicao"));
SELECT setval('"material_id_seq"', (SELECT MAX("id") FROM "material"));
SELECT setval('"metamorfose_id_seq"', (SELECT MAX("id") FROM "metamorfose"));
SELECT setval('"oraculo_id_seq"', (SELECT MAX("id") FROM "oraculo"));
SELECT setval('"poder_id_seq"', (SELECT MAX("id") FROM "poder"));
SELECT setval('"poder_ser_id_seq"', (SELECT MAX("id") FROM "poder_ser"));
SELECT setval('"poder_tipo_id_seq"', (SELECT MAX("id") FROM "poder_tipo"));
SELECT setval('"profecia_id_seq"', (SELECT MAX("id") FROM "profecia"));
SELECT setval('"profecia_aventura_id_seq"', (SELECT MAX("id") FROM "profecia_aventura"));
SELECT setval('"profecia_ser_id_seq"', (SELECT MAX("id") FROM "profecia_ser"));
SELECT setval('"ser_id_seq"', (SELECT MAX("id") FROM "ser"));
SELECT setval('"ser_aventura_id_seq"', (SELECT MAX("id") FROM "ser_aventura"));
SELECT setval('"ser_maldicao_id_seq"', (SELECT MAX("id") FROM "ser_maldicao"));