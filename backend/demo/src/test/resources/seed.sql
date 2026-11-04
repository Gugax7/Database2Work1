-- Synthetic data; this file is never loaded by the application.
INSERT INTO ser ("Nome","EstadoVital","Alinhamento","Categoria") VALUES
 ('Deusa Teste','Imortal','Bom','Deus'),
 ('Mortal Teste','Vivo','Bom','Mortal'),
 ('Herói Teste','Vivo','Bom','Semideus'),
 ('Monstro Teste','Morto','Maligno','Monstro'),
 ('Ser Sem Vínculos','Desconhecido','Neutro','Mortal');
INSERT INTO deus VALUES (1,'Olimpo','Sabedoria',NULL,NULL);
INSERT INTO mortal (ser_id) VALUES (2),(5);
INSERT INTO semideus VALUES (3,1,2,'Força');
INSERT INTO heroi VALUES (3,'Proteger', 'Mentor em texto');
INSERT INTO vilao VALUES (4,'Ameaçar',9);
INSERT INTO monstro VALUES (4,'Caverna',9,'Híbrido');
INSERT INTO poder ("Nome","Intensidade","Origem") VALUES ('Poder Teste',8,'Divina'),('Outro Poder',5,'Mágica');
INSERT INTO poder_ser (ser_id,poder_id,"NivelDominio") VALUES (4,1,9);
INSERT INTO maldicao ("Nome","Severidade","DeusQueLancou") VALUES ('Maldição Teste','Grave','Deusa Teste');
INSERT INTO local ("Nome","RegiaoGeografica","Tipo") VALUES ('Local Teste','Região Teste','Ilha');
INSERT INTO aventura ("Nome","AnoInicio","Objetivo","Status",local_id) VALUES
 ('Jornada Teste',-1200,'Buscar o poder','Concluida',1),('Jornada Vazia',-1100,'Retornar','Pendente',1);
INSERT INTO ser_aventura (ser_id,aventura_id,"SerMorreu") VALUES (3,1,0),(4,1,1);
INSERT INTO oraculo ("Nome","Localizacao") VALUES ('Oráculo Teste','Ilha'),('Outro Oráculo','Monte');
INSERT INTO profecia (oraculo_id,"DataEnunciado","DescricaoCurta","Estado") VALUES
 (1,'1200-01-01','A jornada terá um fim','Cumprida'), (2,'1200-01-02','O poder virá','Pendente');
INSERT INTO profecia_aventura (profecia_id,aventura_id) VALUES (1,1),(2,1);
INSERT INTO material ("Nome","Dureza") VALUES ('Material Teste',7),('Outro Material',5);
INSERT INTO artefato ("Nome",material_id,"PoderEspecial","IsAmaldicoado") VALUES ('Artefato Teste',1,'Poder de teste',1),('Artefato Vazio',NULL,NULL,0);
INSERT INTO artefato_tipo (artefato_id,"Tipo") VALUES (1,'Arma'),(1,'Relíquia');
INSERT INTO forja (artefato_id,material_id,forjador_ser_id) VALUES (1,1,1),(1,2,2);
