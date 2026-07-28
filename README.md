<div align="center">
  <img src="https://img.shields.io/badge/Status-Em_Produ%C3%A7%C3%A3o-10B981?style=for-the-badge" alt="Status" />
  <h1>🏗️ Diário de Obras PWA</h1>
  <p><b>Sistema de Gestão e Relatórios Diários para Engenharia de Campo</b></p>
</div>

<br>

## 📖 Sobre o Projeto

O **Diário de Obras PWA** é uma aplicação Full Stack desenvolvida para revolucionar e digitalizar o apontamento de produção em canteiros de obras (focada em montagem e pré-moldados).

Projetado como um **PWA (Progressive Web App) Offline-First**, ele resolve um dos maiores gargalos da construção civil: a falta de sinal de internet nas frentes de trabalho. O sistema substitui completamente as pranchetas e papéis, permitindo a coleta segura de dados e fotos, otimizando o faturamento e a análise de métricas pela diretoria.

## 🚀 Principais Funcionalidades

### 📱 Aplicativo de Campo (PWA)
* **Modo 100% Offline:** Utilização de *Service Workers* e *LocalStorage* para retenção de dados. O encarregado preenche todo o diário sem internet, e o sistema gerencia uma fila de sincronização automática assim que a conexão é restaurada.
* **Coleta de Evidências Fotográficas:** Upload e compressão de imagens em tempo real para registro de ocorrências, avanços da obra e qualidade dos pré-moldados.
* **Apontamento de Maquinário e Equipe:** Lançamento preciso de horas de guindaste, horas de munck, volume total montado (m³) e registro nominal da equipe presente.
* **Tratamento de Dados Nativos:** Teclados otimizados para mobile e sanitização automática de caracteres (vírgulas para pontos decimais), blindando o banco de dados contra erros de digitação.

### 💻 Dashboard Gerencial e Automações
* **Gestão de Canteiros (CRUD):** Painel de controle para ativação, edição e encerramento de frentes de trabalho ativas pela interface.
* **Geração de Laudos em PDF Premium:** Formatação automatizada via folhas de estilo de impressão (`print CSS`). Garante documentos limpos, profissionais e sem quebras indesejadas de fotos e tabelas para compartilhamento imediato.
* **Métricas em Tempo Real:** Gráficos de barra e linha comparando o avanço produtivo (m³ montados) contra o consumo de equipamentos alugados (horas).
* **Automação via Webhooks:** Integração com gatilhos externos que disparam o resumo do diário diretamente no WhatsApp do cliente ou da diretoria no exato momento em que é salvo no sistema.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes ferramentas modernas do ecossistema de desenvolvimento:

* **[Next.js 14+](https://nextjs.org/) & [React](https://reactjs.org/):** Framework principal (App Router) garantindo máxima performance, renderização otimizada e estruturação robusta de rotas.
* **[TypeScript](https://www.typescriptlang.org/):** Tipagem estática para garantir um código robusto, previsível e livre de bugs durante a manutenção e o tratamento de dados.
* **[Tailwind CSS](https://tailwindcss.com/):** Estilização utilitária para criar um design responsivo, moderno e corporativo (Foco em *Dark Mode* e *Glassmorphism*).
* **[Supabase](https://supabase.com/):** Backend as a Service (BaaS) atuando como o motor da aplicação:
  * **PostgreSQL:** Banco de dados relacional poderoso e escalável.
  * **Supabase Auth:** Autenticação de usuários protegendo o acesso aos dados sensíveis da construtora.
  * **Supabase Storage:** Armazenamento seguro de *buckets* para as fotos e evidências anexadas aos relatórios.
* **[next-pwa](https://ducanh-next-pwa.vercel.app/):** Motor que transforma a aplicação web em um aplicativo nativo instalável, configurando estratégias avançadas de cache (Workbox).
* **[Make.com](https://www.make.com/):** Plataforma de automação visual utilizada para escutar os webhooks do banco de dados e disparar notificações automatizadas de apontamento.

---

## 👨‍💻 Autor

Projeto desenvolvido e arquitetado por **Carlos Silva**.
* [LinkedIn](https://www.linkedin.com/in/carlos-silva-xiru/)
* [GitHub](https://github.com/Carlos-xiruu)
