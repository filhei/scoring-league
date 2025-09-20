# Web scraping imports
import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
from datetime import datetime
import time
import re
import os

# Data analysis imports
import numpy as np


url = os.getenv("BOKAT_URL")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}


response = requests.get(url, headers=headers, timeout=10)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")
# soup = BeautifulSoup(response.content, "html.parser")


def find_player_table(soup):
    # Look for the Status header
    status_header = soup.find("th", string=lambda text: text and "Status" in text)
    if status_header:
        # Navigate up to find the table
        table = status_header.find_parent("table")
        if table:
            # Verify it's the right table by checking other headers
            headers = table.find_all("th")
            header_texts = [h.get_text(strip=True) for h in headers]
            if all(
                header in header_texts
                for header in ["Status", "Namn", "Gäst", "Kommentar"]
            ):
                return table
    return None


def find_attending_players(player_table, player_names):
    players = []
    for row in table:
        if row.name != "tr":
            continue

        name_cell = row.find("td", class_="TextSmall")
        if not name_cell:
            continue

        player_name = name_cell.get_text()
        if "(" in player_name:
            player_name = "(".join(
                player_name.split("(")[:-1]
            )  # remove dates in parentheses

        player_name = player_name.strip()

        if player_name in player_names:
            # img_tag = row.find('img', src='/images/no.png')
            img_tag = row.find(
                "img",
                src=lambda x: x and x.startswith("/images/") and x.endswith(".png"),
            )
            if img_tag:
                src = img_tag.get("src")
                filename = os.path.basename(src)  # Gets 'no.png'
                name_without_extension = os.path.splitext(filename)[0]

                is_attending = name_without_extension == "yes"
                if is_attending:
                    players.append(player_name)

    return players


table = find_player_table(soup)
player_names = ["Enter matching players"]
status = find_attending_players(table, player_names)
