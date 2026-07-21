"""
Pipeline ETL - Crypto & Fiat Ingestion
Responsável por extrair dados das APIs externas, padronizar as chaves 
e salvar no banco de dados local (SQLite) de forma contínua.
"""

import logging
import sqlite3
import time  # 1. IMPORT DO TIME NO TOPO
from datetime import datetime, timezone
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

DB_NAME = "cotacoes.db"
COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
AWESOMEAPI_URL = "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL"
REQUEST_TIMEOUT = 5


def init_db():
    """Garante a criação do esquema unificado no SQLite."""
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


def fetch_and_transform() -> list[tuple[str, float, str]]:
    """
    Extrai das APIs e Transforma para o padrão aceito pelo Front-end:
    - Cripto: 'BTC-BRL', 'BTC-USD', 'ETH-BRL', 'ETH-USD'
    - Câmbio: 'USD-BRL', 'EUR-BRL'
    """
    registros = []
    timestamp = datetime.now(timezone.utc).isoformat()

    # 1. Extração Cripto (CoinGecko - BRL e USD)
    try:
        resp = requests.get(
            COINGECKO_URL, 
            params={"ids": "bitcoin,ethereum", "vs_currencies": "brl,usd"}, 
            timeout=REQUEST_TIMEOUT
        )
        resp.raise_for_status()
        data = resp.json()
        
        # BRL
        registros.append(("BTC-BRL", float(data["bitcoin"]["brl"]), timestamp))
        registros.append(("ETH-BRL", float(data["ethereum"]["brl"]), timestamp))
        # USD
        registros.append(("BTC-USD", float(data["bitcoin"]["usd"]), timestamp))
        registros.append(("ETH-USD", float(data["ethereum"]["usd"]), timestamp))
    except Exception as exc:
        logger.error("Falha ao extrair Cripto: %s", exc)

    # 2. Extração Câmbio (AwesomeAPI)
    try:
        resp = requests.get(AWESOMEAPI_URL, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        registros.append(("USD-BRL", float(data["USDBRL"]["bid"]), timestamp))
        registros.append(("EUR-BRL", float(data["EURBRL"]["bid"]), timestamp))
    except Exception as exc:
        logger.error("Falha ao extrair Câmbio: %s", exc)

    return registros


def load_to_db(registros: list[tuple[str, float, str]]):
    """Insere os dados processados na tabela SQLite (Carga)."""
    if not registros:
        logger.warning("Nenhum dado válido para salvar.")
        return

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.executemany(
            "INSERT INTO cotacoes (moeda, valor, data_extracao) VALUES (?, ?, ?)",
            registros
        )
        conn.commit()
        logger.info("%d cotações persistidas no SQLite.", len(registros))


# 2. LOOP CONTÍNUO NO FINAL DO ARQUIVO
if __name__ == "__main__":
    init_db()
    
    INTERVALO_SEGUNDOS = 30
    logger.info("🚀 Pipeline ETL iniciado! Atualizando dados a cada %d segundos...", INTERVALO_SEGUNDOS)
    
    while True:
        try:
            dados = fetch_and_transform()
            load_to_db(dados)
        except Exception as e:
            logger.error("Erro durante a execução do pipeline: %s", e)
            
        time.sleep(INTERVALO_SEGUNDOS)