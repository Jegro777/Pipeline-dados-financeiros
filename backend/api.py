"""
API REST - Data Delivery Service (FastAPI)
Lê as cotações mais recentes salvas pelo pipeline no SQLite e entrega ao dashboard.
"""

import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DB_NAME = "cotacoes.db"

app = FastAPI(title="Crypto & Exchange Rate API")

# Habilita CORS para o dashboard HTML acessar sem bloqueios do navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def init_db():
    """Fallback para garantir que a tabela existe caso a API suba antes do ETL."""
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cotacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                moeda TEXT NOT NULL,
                valor REAL NOT NULL,
                data_extracao TEXT NOT NULL
            )
        """)
        conn.commit()


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/api/cotacoes")
def obter_cotacoes():
    """
    Busca estritamente o REGISTRO MAIS RECENTE (último ID) de cada moeda.
    Evita retornar duplicatas ou omitir moedas no dashboard.
    """
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        
        # Subquery SQL de Engenharia de Dados:
        # Pega o id MÁXIMO para cada 'moeda' individualmente
        query = """
            SELECT moeda, valor, data_extracao
            FROM cotacoes
            WHERE id IN (
                SELECT MAX(id)
                FROM cotacoes
                GROUP BY moeda
            )
        """
        cursor.execute(query)
        linhas = cursor.fetchall()

    return [
        {"moeda": linha[0], "valor": linha[1], "data": linha[2]}
        for linha in linhas
    ]