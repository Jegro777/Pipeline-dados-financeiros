# 📊 Real-Time Crypto & Exchange Rate Dashboard

> Um sistema full-stack leve de engenharia de dados para coleta automatizada (ETL), armazenamento local e exibição em tempo real de cotações de criptomoedas e taxas de câmbio.

---
| | |
|:---:|:---:|
| <img src="frontend/img/preview_project.png" width="450"> | <img src="frontend/img/preview_project01.png" width="500"> |

## 🛠️ Tecnologias Utilizadas

* **Python 3.10+** (Pipeline ETL e Back-end)
* **FastAPI** (API REST de alta performance)
* **SQLite** (Armazenamento e persistência de dados)
* **HTML5, CSS3 & JavaScript (ES6+)** (Front-end e atualização assíncrona via `fetch`)
* **Uvicorn** (Servidor ASGI)

---

## 🏗️ Arquitetura do Projeto

O projeto é dividido em três camadas principais para garantir desacoplamento e escalabilidade:
1. **Pipeline de Ingestão (ETL):** Um script em Python (`app.py`) que consome dados de APIs de mercado em intervalos regulares e os persiste de forma estruturada.
2. **Data Delivery Service (API REST):** Uma aplicação FastAPI (`api.py`) que expõe endpoints otimizados para consultar os registros mais recentes por meio de subqueries SQL eficientes.
3. **Dashboard (Front-end):** Uma interface web responsiva que consome a API de forma assíncrona (`setInterval` a cada 30 segundos) sem a necessidade de recarregar a página.

---

## 🚀 Como Executar o Projeto Localmente

Siga os passos abaixo para configurar e rodar a aplicação em sua máquina.

### Pré-requisitos
Certifique-se de ter o **Python** instalado em seu sistema.

### 1. Clonar o repositório
```bash```
git clone [https://github.com/Jegro777/Pipeline-dados-financeiros](https://github.com/Jegro777/Pipeline-dados-financeiros)
cd Pipeline-dados-financeiros

### 2. Instalar as dependências
Instale os pacotes necessários (FastAPI, Uvicorn):

Bash
pip install fastapi uvicorn requests

### 3. Executar o Back-end (API)
Abra um terminal na pasta raiz do projeto e inicie o servidor da API com o Uvicorn:

Bash
uvicorn api:app --reload
A API estará disponível em http://127.0.0.1:8000. Você pode testar a documentação interativa em http://127.0.0.1:8000/docs.

### 4. Executar o Pipeline de Dados (ETL)
Em outro terminal, execute o script responsável por alimentar o banco de dados SQLite:

Bash
python app.py

### 5. Abrir o Dashboard
Abra o arquivo index.html diretamente no seu navegador de preferência para visualizar o painel em tempo real atualizando as cotações.

📌 Endpoints da API
GET /api/cotacoes: Retorna uma lista contendo o registro mais recente (último ID) de cada moeda cadastrada, evitando duplicatas e otimizando a entrega ao front-end.

👨‍💻 Autor
Desenvolvido por Thiago Jesus.


---

### 📝 Descrição curta para a página principal do Repositório (About)

> **Description:** Dashboard em tempo real para monitoramento de cotações de criptomoedas e câmbio, desenvolvido com Python, FastAPI, SQLite e JavaScript vanilla.
> **Topics:** `fastapi`, `python`, `data-engineering`, `sqlite`, `dashboard`, `cryptocurrency`, `etl`
