--
-- PostgreSQL database dump
--

\restrict X0pP5t9E7zAGodTHsoU0ipbOwRYawVFzTovytheAvTc95CjqKAS9yGgvZEdnUii

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-10-08 16:08:08

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE "JULIAMIRANDA";
--
-- TOC entry 5101 (class 1262 OID 16388)
-- Name: JULIAMIRANDA; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "JULIAMIRANDA" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Portuguese_Brazil.1252';


ALTER DATABASE "JULIAMIRANDA" OWNER TO postgres;

\unrestrict X0pP5t9E7zAGodTHsoU0ipbOwRYawVFzTovytheAvTc95CjqKAS9yGgvZEdnUii
\connect "JULIAMIRANDA"
\restrict X0pP5t9E7zAGodTHsoU0ipbOwRYawVFzTovytheAvTc95CjqKAS9yGgvZEdnUii

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16756)
-- Name: cargo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cargo (
    id_cargo integer NOT NULL,
    nome_cargo character varying(45) NOT NULL
);


ALTER TABLE public.cargo OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16755)
-- Name: cargo_id_cargo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cargo_id_cargo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cargo_id_cargo_seq OWNER TO postgres;

--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 223
-- Name: cargo_id_cargo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cargo_id_cargo_seq OWNED BY public.cargo.id_cargo;


--
-- TOC entry 227 (class 1259 OID 16779)
-- Name: cliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cliente (
    id_pessoa integer NOT NULL,
    renda_cliente double precision,
    data_de_cadastro_cliente date
);


ALTER TABLE public.cliente OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16747)
-- Name: formadepagamento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formadepagamento (
    id_forma_pagamento integer NOT NULL,
    nome_forma_pagamento character varying(100) NOT NULL
);


ALTER TABLE public.formadepagamento OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16746)
-- Name: formadepagamento_id_forma_pagamento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.formadepagamento_id_forma_pagamento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formadepagamento_id_forma_pagamento_seq OWNER TO postgres;

--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 221
-- Name: formadepagamento_id_forma_pagamento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.formadepagamento_id_forma_pagamento_seq OWNED BY public.formadepagamento.id_forma_pagamento;


--
-- TOC entry 228 (class 1259 OID 16790)
-- Name: funcionario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcionario (
    id_pessoa integer NOT NULL,
    salario double precision,
    cargo_id_cargo integer,
    porcentagem_comissao double precision
);


ALTER TABLE public.funcionario OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16825)
-- Name: pagamento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pagamento (
    id_pedido integer NOT NULL,
    data_pagamento timestamp without time zone,
    valor_total_pagamento double precision,
    status_pagamento character varying DEFAULT 'inconcluido'::character varying
);


ALTER TABLE public.pagamento OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16853)
-- Name: pagamentohasformapagamento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pagamentohasformapagamento (
    id_pedido integer NOT NULL,
    id_forma_pagamento integer NOT NULL,
    valor_pago double precision
);


ALTER TABLE public.pagamentohasformapagamento OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16807)
-- Name: pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedido (
    id_pedido integer NOT NULL,
    data_do_pedido date NOT NULL,
    id_cliente integer,
    id_funcionario integer
);


ALTER TABLE public.pedido OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16806)
-- Name: pedido_id_pedido_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedido_id_pedido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedido_id_pedido_seq OWNER TO postgres;

--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 229
-- Name: pedido_id_pedido_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedido_id_pedido_seq OWNED BY public.pedido.id_pedido;


--
-- TOC entry 232 (class 1259 OID 16836)
-- Name: pedidohastenis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidohastenis (
    id_tenis integer NOT NULL,
    id_pedido integer NOT NULL,
    quantidade integer,
    preco_unitario double precision
);


ALTER TABLE public.pedidohastenis OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16765)
-- Name: pessoa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pessoa (
    id_pessoa integer NOT NULL,
    nome_pessoa character varying(60) NOT NULL,
    email_pessoa character varying(70) NOT NULL,
    senha_pessoa character varying(32) NOT NULL,
    data_nascimento_pessoa date NOT NULL,
    endereco character varying(200) NOT NULL,
    id_pedido_atual integer
);


ALTER TABLE public.pessoa OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16764)
-- Name: pessoa_id_pessoa_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pessoa_id_pessoa_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pessoa_id_pessoa_seq OWNER TO postgres;

--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 225
-- Name: pessoa_id_pessoa_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pessoa_id_pessoa_seq OWNED BY public.pessoa.id_pessoa;


--
-- TOC entry 220 (class 1259 OID 16736)
-- Name: produto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produto (
    id_tenis integer NOT NULL,
    nome_tenis character varying(45) NOT NULL,
    tamanho_disponivel character varying(10),
    quantidade_em_estoque integer NOT NULL,
    preco_unitario double precision NOT NULL,
    imagem_url character varying(255)
);


ALTER TABLE public.produto OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16735)
-- Name: produto_id_tenis_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.produto_id_tenis_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.produto_id_tenis_seq OWNER TO postgres;

--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 219
-- Name: produto_id_tenis_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.produto_id_tenis_seq OWNED BY public.produto.id_tenis;


--
-- TOC entry 4898 (class 2604 OID 16759)
-- Name: cargo id_cargo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargo ALTER COLUMN id_cargo SET DEFAULT nextval('public.cargo_id_cargo_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 16750)
-- Name: formadepagamento id_forma_pagamento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formadepagamento ALTER COLUMN id_forma_pagamento SET DEFAULT nextval('public.formadepagamento_id_forma_pagamento_seq'::regclass);


--
-- TOC entry 4900 (class 2604 OID 16810)
-- Name: pedido id_pedido; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido ALTER COLUMN id_pedido SET DEFAULT nextval('public.pedido_id_pedido_seq'::regclass);


--
-- TOC entry 4899 (class 2604 OID 16768)
-- Name: pessoa id_pessoa; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pessoa ALTER COLUMN id_pessoa SET DEFAULT nextval('public.pessoa_id_pessoa_seq'::regclass);


--
-- TOC entry 4896 (class 2604 OID 16739)
-- Name: produto id_tenis; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produto ALTER COLUMN id_tenis SET DEFAULT nextval('public.produto_id_tenis_seq'::regclass);


--
-- TOC entry 5086 (class 0 OID 16756)
-- Dependencies: 224
-- Data for Name: cargo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cargo VALUES (1, 'Vendedor');
INSERT INTO public.cargo VALUES (2, 'Gerente');
INSERT INTO public.cargo VALUES (3, 'Caixa');
INSERT INTO public.cargo VALUES (4, 'Estoquista');
INSERT INTO public.cargo VALUES (5, 'Assistente de Vendas');
INSERT INTO public.cargo VALUES (6, 'Supervisor');
INSERT INTO public.cargo VALUES (7, 'Atendente Online');
INSERT INTO public.cargo VALUES (8, 'Administrador');
INSERT INTO public.cargo VALUES (9, 'Analista de Marketing');
INSERT INTO public.cargo VALUES (10, 'Auxiliar de Limpeza');


--
-- TOC entry 5089 (class 0 OID 16779)
-- Dependencies: 227
-- Data for Name: cliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cliente VALUES (2, 4200, '2022-05-20');
INSERT INTO public.cliente VALUES (3, 2800, '2023-07-11');
INSERT INTO public.cliente VALUES (4, 5000, '2021-09-30');
INSERT INTO public.cliente VALUES (5, 3200, '2023-02-17');
INSERT INTO public.cliente VALUES (6, 4100, '2022-12-01');
INSERT INTO public.cliente VALUES (7, 2900, '2023-06-06');
INSERT INTO public.cliente VALUES (8, 6000, '2021-03-25');
INSERT INTO public.cliente VALUES (9, 2700, '2023-08-19');
INSERT INTO public.cliente VALUES (10, 3300, '2023-09-10');
INSERT INTO public.cliente VALUES (1, 3500, '2023-01-15');


--
-- TOC entry 5084 (class 0 OID 16747)
-- Dependencies: 222
-- Data for Name: formadepagamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.formadepagamento VALUES (1, 'Cartão de Crédito');
INSERT INTO public.formadepagamento VALUES (2, 'Cartão de Débito');
INSERT INTO public.formadepagamento VALUES (3, 'Pix');
INSERT INTO public.formadepagamento VALUES (4, 'Boleto Bancário');
INSERT INTO public.formadepagamento VALUES (5, 'Transferência');
INSERT INTO public.formadepagamento VALUES (6, 'Dinheiro');
INSERT INTO public.formadepagamento VALUES (7, 'Vale Presente');
INSERT INTO public.formadepagamento VALUES (8, 'Carteira Digital');
INSERT INTO public.formadepagamento VALUES (9, 'Cheque');
INSERT INTO public.formadepagamento VALUES (10, 'Crediário');


--
-- TOC entry 5090 (class 0 OID 16790)
-- Dependencies: 228
-- Data for Name: funcionario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.funcionario VALUES (2, 3500, 2, 10);
INSERT INTO public.funcionario VALUES (3, 1800, 3, 2);
INSERT INTO public.funcionario VALUES (4, 2500, 4, 3.5);
INSERT INTO public.funcionario VALUES (5, 2200, 5, 4);
INSERT INTO public.funcionario VALUES (6, 2700, 6, 6);
INSERT INTO public.funcionario VALUES (7, 1900, 7, 2.5);
INSERT INTO public.funcionario VALUES (8, 4000, 8, 8);
INSERT INTO public.funcionario VALUES (9, 3000, 9, 7);
INSERT INTO public.funcionario VALUES (10, 1500, 10, 1.5);
INSERT INTO public.funcionario VALUES (-1, 1, 1, 1);


--
-- TOC entry 5093 (class 0 OID 16825)
-- Dependencies: 231
-- Data for Name: pagamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pagamento VALUES (1, '2025-10-08 00:15:24.616', 2099.94, 'concluido');
INSERT INTO public.pagamento VALUES (2, '2025-10-08 00:15:24.616', 2099.94, 'concluido');
INSERT INTO public.pagamento VALUES (4, '2025-10-08 00:15:24.616', 2099.94, 'concluido');
INSERT INTO public.pagamento VALUES (5, '2025-10-08 00:15:24.616', 2099.94, 'concluido');
INSERT INTO public.pagamento VALUES (7, '2025-10-08 00:15:24.616', 2099.94, 'concluido');
INSERT INTO public.pagamento VALUES (8, '2025-10-08 00:15:24.616', 2099.94, 'concluido');
INSERT INTO public.pagamento VALUES (38, '2025-10-08 00:15:24.616', 2099.94, 'concluido');
INSERT INTO public.pagamento VALUES (10, '2025-10-08 00:15:24.616', 2099.94, 'concluido');
INSERT INTO public.pagamento VALUES (9, '2025-10-08 00:15:24.616', 2099.94, 'concluido');


--
-- TOC entry 5095 (class 0 OID 16853)
-- Dependencies: 233
-- Data for Name: pagamentohasformapagamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pagamentohasformapagamento VALUES (38, 3, 2099.94);


--
-- TOC entry 5092 (class 0 OID 16807)
-- Dependencies: 230
-- Data for Name: pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pedido VALUES (2, '2023-02-15', 3, 4);
INSERT INTO public.pedido VALUES (4, '2023-04-25', 7, 8);
INSERT INTO public.pedido VALUES (5, '2023-05-30', 9, 10);
INSERT INTO public.pedido VALUES (7, '2023-07-12', 4, 3);
INSERT INTO public.pedido VALUES (8, '2023-08-18', 6, 5);
INSERT INTO public.pedido VALUES (9, '2023-09-22', 8, 7);
INSERT INTO public.pedido VALUES (10, '2023-10-28', 10, 9);
INSERT INTO public.pedido VALUES (38, '2025-10-08', 2, 3);
INSERT INTO public.pedido VALUES (40, '2025-10-08', 1, -1);
INSERT INTO public.pedido VALUES (1, '2023-02-15', 3, 4);
INSERT INTO public.pedido VALUES (41, '2025-10-08', 2, 2);


--
-- TOC entry 5094 (class 0 OID 16836)
-- Dependencies: 232
-- Data for Name: pedidohastenis; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pedidohastenis VALUES (2, 2, 1, 259.5);
INSERT INTO public.pedidohastenis VALUES (4, 4, 1, 279);
INSERT INTO public.pedidohastenis VALUES (5, 5, 1, 319.75);
INSERT INTO public.pedidohastenis VALUES (7, 7, 1, 359.99);
INSERT INTO public.pedidohastenis VALUES (8, 8, 1, 269.9);
INSERT INTO public.pedidohastenis VALUES (9, 9, 1, 389);
INSERT INTO public.pedidohastenis VALUES (10, 10, 1, 299);
INSERT INTO public.pedidohastenis VALUES (3, 38, 6, 349.99);
INSERT INTO public.pedidohastenis VALUES (3, 41, 3, 349.99);
INSERT INTO public.pedidohastenis VALUES (4, 41, 2, 279);


--
-- TOC entry 5088 (class 0 OID 16765)
-- Dependencies: 226
-- Data for Name: pessoa; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pessoa VALUES (3, 'Carlos Souza', 'carlos.souza@email.com', 'senha123', '1992-07-08', 'Rua XV de Novembro, 150 - Curitiba - PR', NULL);
INSERT INTO public.pessoa VALUES (4, 'Ana Pereira', 'ana.pereira@email.com', 'senha123', '1998-11-25', 'Av. Independência, 500 - Belo Horizonte - MG', NULL);
INSERT INTO public.pessoa VALUES (5, 'Lucas Fernandes', 'lucas.fernandes@email.com', 'senha123', '2000-02-10', 'Rua das Flores, 75 - Florianópolis - SC', NULL);
INSERT INTO public.pessoa VALUES (6, 'Mariana Costa', 'mariana.costa@email.com', 'senha123', '1995-09-18', 'Av. Goiás, 800 - Goiânia - GO', NULL);
INSERT INTO public.pessoa VALUES (7, 'Rafael Gomes', 'rafael.gomes@email.com', 'senha123', '1988-06-01', 'Rua Bahia, 250 - Salvador - BA', NULL);
INSERT INTO public.pessoa VALUES (8, 'Juliana Rocha', 'juliana.rocha@email.com', 'senha123', '1993-10-30', 'Av. Paulista, 1500 - São Paulo - SP', NULL);
INSERT INTO public.pessoa VALUES (9, 'Paulo Henrique', 'paulo.henrique@email.com', 'senha123', '1997-04-15', 'Rua Ceará, 300 - Manaus - AM', NULL);
INSERT INTO public.pessoa VALUES (10, 'Fernanda Lima', 'fernanda.lima@email.com', 'senha123', '2001-12-05', 'Av. das Torres, 999 - Manaus - AM', NULL);
INSERT INTO public.pessoa VALUES (-1, 'Não definido', 'n', 'n', '1999-01-01', 'n', NULL);
INSERT INTO public.pessoa VALUES (1, 'João Silva', 'joao.silva@email.com', 'senha123', '1990-05-12', 'Rua das Palmeiras, 100 - São Paulo - SP', 40);
INSERT INTO public.pessoa VALUES (2, 'Maria Oliveira', 'maria.oliveira@email.com', '456', '1985-03-20', 'Av. Brasil, 2000 - Rio de Janeiro - RJ', 41);


--
-- TOC entry 5082 (class 0 OID 16736)
-- Dependencies: 220
-- Data for Name: produto; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.produto VALUES (1, 'Tênis Pro Attack', '38-44', 50, 299.9, '/imagens/1759948320731-796308757.jpeg');
INSERT INTO public.produto VALUES (2, 'Tênis Smash Pro', '36-42', 40, 259.5, '/imagens/1759948390674-176627066.jpeg');
INSERT INTO public.produto VALUES (3, 'Tênis Volley Master', '37-44', 30, 349.99, '/imagens/1759948432146-456680366.jpeg');
INSERT INTO public.produto VALUES (4, 'Tênis Jump Force', '39-43', 25, 279, '/imagens/1759948493770-129756388.jpeg');
INSERT INTO public.produto VALUES (5, 'Tênis Power Spike', '38-44', 60, 319.75, '/imagens/1759948533803-268396982.jpeg');
INSERT INTO public.produto VALUES (6, 'Tênis Air Block', '37-41', 35, 239.9, '/imagens/1759948559130-553662885.jpeg');
INSERT INTO public.produto VALUES (7, 'Tênis Fast Court', '39-45', 45, 359.99, '/imagens/1759948595515-214543939.jpeg');
INSERT INTO public.produto VALUES (8, 'Tênis Impact Max', '36-42', 55, 269.9, '/imagens/1759948629234-67059358.jpeg');
INSERT INTO public.produto VALUES (9, 'Tênis Ultra Volley', '38-44', 20, 389, '/imagens/1759948712850-907937266.jpeg');
INSERT INTO public.produto VALUES (10, 'Tênis Light Speed', '37-42', 28, 299, '/imagens/1759948762138-612152807.jpeg');


--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 223
-- Name: cargo_id_cargo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cargo_id_cargo_seq', 10, true);


--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 221
-- Name: formadepagamento_id_forma_pagamento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formadepagamento_id_forma_pagamento_seq', 10, true);


--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 229
-- Name: pedido_id_pedido_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedido_id_pedido_seq', 41, true);


--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 225
-- Name: pessoa_id_pessoa_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pessoa_id_pessoa_seq', 10, true);


--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 219
-- Name: produto_id_tenis_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.produto_id_tenis_seq', 10, true);


--
-- TOC entry 4907 (class 2606 OID 16763)
-- Name: cargo cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargo
    ADD CONSTRAINT cargo_pkey PRIMARY KEY (id_cargo);


--
-- TOC entry 4913 (class 2606 OID 16784)
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id_pessoa);


--
-- TOC entry 4905 (class 2606 OID 16754)
-- Name: formadepagamento formadepagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formadepagamento
    ADD CONSTRAINT formadepagamento_pkey PRIMARY KEY (id_forma_pagamento);


--
-- TOC entry 4915 (class 2606 OID 16795)
-- Name: funcionario funcionario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_pkey PRIMARY KEY (id_pessoa);


--
-- TOC entry 4919 (class 2606 OID 16830)
-- Name: pagamento pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_pkey PRIMARY KEY (id_pedido);


--
-- TOC entry 4923 (class 2606 OID 16859)
-- Name: pagamentohasformapagamento pagamentohasformapagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentohasformapagamento
    ADD CONSTRAINT pagamentohasformapagamento_pkey PRIMARY KEY (id_pedido, id_forma_pagamento);


--
-- TOC entry 4917 (class 2606 OID 16814)
-- Name: pedido pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_pkey PRIMARY KEY (id_pedido);


--
-- TOC entry 4921 (class 2606 OID 16842)
-- Name: pedidohastenis pedidohastenis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidohastenis
    ADD CONSTRAINT pedidohastenis_pkey PRIMARY KEY (id_tenis, id_pedido);


--
-- TOC entry 4909 (class 2606 OID 16778)
-- Name: pessoa pessoa_email_pessoa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pessoa
    ADD CONSTRAINT pessoa_email_pessoa_key UNIQUE (email_pessoa);


--
-- TOC entry 4911 (class 2606 OID 16776)
-- Name: pessoa pessoa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pessoa
    ADD CONSTRAINT pessoa_pkey PRIMARY KEY (id_pessoa);


--
-- TOC entry 4903 (class 2606 OID 16745)
-- Name: produto produto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produto
    ADD CONSTRAINT produto_pkey PRIMARY KEY (id_tenis);


--
-- TOC entry 4924 (class 2606 OID 16785)
-- Name: cliente cliente_id_pessoa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_id_pessoa_fkey FOREIGN KEY (id_pessoa) REFERENCES public.pessoa(id_pessoa) ON DELETE CASCADE;


--
-- TOC entry 4925 (class 2606 OID 16801)
-- Name: funcionario funcionario_cargo_id_cargo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_cargo_id_cargo_fkey FOREIGN KEY (cargo_id_cargo) REFERENCES public.cargo(id_cargo);


--
-- TOC entry 4926 (class 2606 OID 16796)
-- Name: funcionario funcionario_id_pessoa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_id_pessoa_fkey FOREIGN KEY (id_pessoa) REFERENCES public.pessoa(id_pessoa) ON DELETE CASCADE;


--
-- TOC entry 4929 (class 2606 OID 16831)
-- Name: pagamento pagamento_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamento
    ADD CONSTRAINT pagamento_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 16865)
-- Name: pagamentohasformapagamento pagamentohasformapagamento_id_forma_pagamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentohasformapagamento
    ADD CONSTRAINT pagamentohasformapagamento_id_forma_pagamento_fkey FOREIGN KEY (id_forma_pagamento) REFERENCES public.formadepagamento(id_forma_pagamento);


--
-- TOC entry 4933 (class 2606 OID 16860)
-- Name: pagamentohasformapagamento pagamentohasformapagamento_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentohasformapagamento
    ADD CONSTRAINT pagamentohasformapagamento_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pagamento(id_pedido) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 16815)
-- Name: pedido pedido_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_pessoa) ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 16820)
-- Name: pedido pedido_id_funcionario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_id_funcionario_fkey FOREIGN KEY (id_funcionario) REFERENCES public.funcionario(id_pessoa) ON DELETE CASCADE;


--
-- TOC entry 4930 (class 2606 OID 16848)
-- Name: pedidohastenis pedidohastenis_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidohastenis
    ADD CONSTRAINT pedidohastenis_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido) ON DELETE CASCADE;


--
-- TOC entry 4931 (class 2606 OID 16843)
-- Name: pedidohastenis pedidohastenis_id_tenis_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidohastenis
    ADD CONSTRAINT pedidohastenis_id_tenis_fkey FOREIGN KEY (id_tenis) REFERENCES public.produto(id_tenis) ON DELETE CASCADE;


-- Completed on 2025-10-08 16:08:08

--
-- PostgreSQL database dump complete
--

\unrestrict X0pP5t9E7zAGodTHsoU0ipbOwRYawVFzTovytheAvTc95CjqKAS9yGgvZEdnUii

