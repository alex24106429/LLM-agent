# PC Builder Agent

## Prerequisites

- [Node.js](https://nodejs.org/en/download)
- A LLM provider (and optionally Brave Search for web access)

## Setup

1. **Clone the repository.**
   ```bash
   git clone https://github.com/alex24106429/LLM-agent
   ```
2. **Create your config file:**
   Copy the example configuration file to create your own:
   ```bash
   cp config.example.json config.json
   ```
3. **Configure your API keys** in `config.json` (see Configuration below).

## Install Dependencies

```bash
npm install
```

## Running the Agent

```bash
npm run dev
```

---

## Configuration (Providers & Models)

The agent reads from `config.json`. You can easily switch between API providers by modifying the `OPENAI_BASE_URL` and `OPENAI_MODEL` fields.

**1. Using Gemini (Has a free tier)**

[Get your free API key here](https://aistudio.google.com/api-keys)

```json
{
	"OPENAI_BASE_URL": "https://generativelanguage.googleapis.com/v1beta/openai/",
	"OPENAI_MODEL": "gemini-3.5-flash",
	"OPENAI_API_KEY": "...",
	"BRAVE_API_KEY": "..."
}
```

**2. Using OpenRouter**

[Find free models here](https://openrouter.ai/models?output_modalities=text&max_price=0&order=most-popular)

```json
{
	"OPENAI_BASE_URL": "https://openrouter.ai/api/v1",
	"OPENAI_MODEL": "google/gemma-4-26b-a4b-it:free",
	"OPENAI_API_KEY": "...",
	"BRAVE_API_KEY": "..."
}
```

**3. Using Local Models (llama.cpp recommended)**

[Get llama.cpp here](https://github.com/ggml-org/llama.cpp/releases/latest).

[Find models here](https://huggingface.co/models?num_parameters=min:0,max:9B&apps=llama.cpp&sort=trending&search=unsloth%2F)
*([Qwen3.5](https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q4_K_M.gguf) and [Gemma 4](https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-Q4_K_M.gguf) are recommended).*

Run llama.cpp server:

```bash
llama-server -c 16384 -m "Qwen3.5-4B-Q4_K_M.gguf" -np 1 --no-mmap -ctk q8_0 -ctv q8_0
```

Example config:

```json
{
	"OPENAI_BASE_URL": "http://localhost:8080/v1",
	"OPENAI_MODEL": "",
	"OPENAI_API_KEY": "not-needed",
	"BRAVE_API_KEY": "..."
}
```


## 1. Probleemanalyse & Doelgroep

### Probleemdefinitie
Het zelf samenstellen van een computer (PC) is voor veel consumenten een complex proces. Men loopt vaak tegen de volgende uitdagingen aan:
*   **Compatibiliteitsproblemen:** Onderdelen zoals processors (CPU), moederborden en werkgeheugen (RAM) passen niet altijd fysiek of elektronisch op elkaar.
*   **Budgetbeheer:** Het is lastig om het budget optimaal te verdelen over de verschillende componenten (bijvoorbeeld: te veel uitgeven aan een CPU waardoor er te weinig budget overblijft voor een videokaart).
*   **Prestatieverwachting:** Consumenten weten vaak niet hoe hun gewenste games of software (bijv. *Cyberpunk 2077* op 1440p resolutie) zullen presteren op een specifieke selectie van onderdelen.
*   **Prijsversnippering:** Dezelfde hardwarecomponenten verschillen sterk in prijs tussen verschillende webshops. Handmatig zoeken naar de goedkoopste, betrouwbare optie kost veel tijd.

Bestaande tools (zoals PCPartPicker) controleren wel grotendeels op compatibiliteit, maar missen de intelligentie om direct op basis van specifieke game-prestatiedoelen en actuele lokale marktprijzen een geoptimaliseerd voorstel te genereren en te valideren.

### Doelgroep
*   **Gamers en creatieve professionals** die een op maat gemaakte PC willen bouwen, maar niet de tijd of diepgaande technische kennis hebben om alle componenten handmatig te vergelijken en te valideren.
*   **Novice PC-bouwers** die behoefte hebben aan een betrouwbare gids die hen behoedt voor compatibiliteits- of prestatiefouten.

---

## 2. Typologie van de Workflow

Op basis van de ontwerprichtlijnen is gekozen voor de volgende opzet:

*   **Workflowtype:** *Planning & Research Workflow*. De agent moet enerzijds informatie opzoeken (prijzen, prestaties en reviews) en anderzijds een logisch, compatibel plan (de onderdelenlijst) opstellen.
*   **Outputtype:** *Besluitondersteuning & Planning*. De gebruiker ontvangt een geoptimaliseerde onderdelenlijst, een overzicht van de goedkoopste aanbieders, en een onderbouwd prestatierapport voor de gekozen games.

---

## 3. Workflowstappen (Van concept naar concrete stappen)

1.  **Wensen analyseren:** De gebruiker voert in vrije tekst zijn budget, gewenste games, resolutie (bijv. 1080p, 1440p, 4K) en overige voorkeuren (zoals behuizingsgrootte of RGB-verlichting) in.
2.  **Core hardware bepalen:** Op basis van de games en resolutie selecteert de agent de minimale en aanbevolen CPU- en GPU-combinatie (videokaart en processor).
3.  **Overige onderdelen matchen:** Selectie van compatibele randcomponenten: moederbord (moet passen bij CPU-socket), RAM (DDR4 vs DDR5), opslag (M.2 SSD), koeler, voeding (PSU) en een behuizing (case).
4.  **Prijzen en winkels zoeken:** De agent zoekt via APIs of scraping-scripts naar de actuele prijzen en voorraad van deze onderdelen bij diverse retailers.
5.  **Reviews analyseren:** Ophalen van reviews of sentimentanalyse van experts en gebruikers om te controleren of een specifiek model component (bijv. een specifieke koeler) geen bekende defecten heeft.
6.  **Prestaties schatten:** Schatten van de te verwachten FPS (Frames Per Second) voor de door de gebruiker opgegeven games op basis van historische benchmarkdata.
7.  **Budget controleren:** Berekenen van de totale som. Ligt de prijs binnen de marge van het gebruikersbudget?
8.  **Compatibiliteit controleren (technisch):** Controleren van fysieke maten (past de videokaart in de behuizing?), het benodigde wattage (levert de voeding genoeg stroom voor de GPU/CPU?) en de koeler-aansluiting.
9.  **Voorstel presenteren:** Genereren van het definitieve overzicht met de onderdelenlijst, prijzen per winkel, prestatie-indicaties en een korte toelichting.

---

## 4. Technische Specificatie per Workflowstap

In onderstaande tabel is vastgelegd welke technologie per stap wordt ingezet (LLM, Tool/API of Regelgebaseerde code).

| Stap | Input | Output | LLM nodig? | Tool / API nodig? | Regelgebaseerd? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Wensen analyseren** | Vrije tekst gebruiker | Gestructureerde JSON (Budget, Games, Resolutie) | **Ja** (om wensen te parsen naar parameters) | Nee | Nee |
| **2. Core hardware bepalen** | JSON parameters | CPU & GPU voorstel | **Ja** (voor advies op basis van actuele marktverhoudingen) | Nee | Deels (minimale systeemeisen database) |
| **3. Overige onderdelen** | Gekozen CPU & GPU | Conceptlijst van alle componenten | **Ja** (om een logisch conceptpakket samen te stellen) | Nee | Nee |
| **4. Prijzen & winkels** | Conceptlijst componenten | Componenten met prijzen en links | Nee | **Ja** (Prijsvergelijker-API of specifieke webshop scraper) | **Ja** (sorteren op laagste prijs) |
| **5. Reviews analyseren** | Onderdelenlijst | Sentiment-score per onderdeel | **Ja** (samenvatten van reviewteksten) | **Ja** (zoeken naar reviews via web-search tool) | Nee |
| **6. Prestaties schatten** | GPU, CPU & Gekozen Games | FPS-schatting per game | **Ja** (inschatting maken op basis van bekende hardwarecombinaties) | **Ja** (optioneel: benchmark-database raadplegen) | Nee |
| **7. Budget controleren** | Prijzenlijst, gebruikersbudget | Totaalprijs & Budget-status (Ok / Te duur) | Nee | Nee | **Ja** (Sommatie van prijzen en vergelijking: `totaal <= budget`) |
| **8. Compatibiliteit** | Volledige onderdelenlijst | Compatibiliteit-status (Ok / Foutmelding) | Nee | Nee | **Ja** (Regelgebaseerde checks: TDP berekening, socket-vergelijking, form-factor match) |
| **9. Voorstel presenteren** | Gevalideerde JSON met alle data | Gebruikersvriendelijk rapport en kooplinks | **Ja** (om de data om te zetten in een helder advies) | Nee | Nee |

---

## 5. Validatie, Herstelacties en Loops

Om de betrouwbaarheid van de agent te waarborgen, zijn er herstelacties (loops) ingebouwd voor situaties waarin het conceptontwerp niet aan de eisen voldoet.

| Validatiemethode | Betekenis in deze agent | Herstelactie (Loop) bij fout |
| :--- | :--- | :--- |
| **Completeness check** (op Stap 1) | Controleert of het budget en minimaal één game of gebruiksdoel zijn ingevoerd. | De agent vraagt de gebruiker om aanvullende informatie (bijv. "Wat is uw maximale budget?"). |
| **Consistency check** (op Stap 7) | **Budgetcontrole:** Is de som van de laagst gevonden prijzen van de geselecteerde onderdelen lager of gelijk aan het budget van de gebruiker? | **Loop terug naar Stap 2/3:** Als het budget met meer dan 5% wordt overschreden, krijgt de LLM de opdracht om goedkopere alternatieven te selecteren (bijvoorbeeld een stap terug in GPU of een goedkoper moederbord) en de prijsstap opnieuw uit te voeren. |
| **Technische Validatie** (op Stap 8) | **Compatibiliteitscontrole:** <br>1. Is de som van het TDP (stroomverbruik) van CPU + GPU + 100W marge lager dan het vermogen van de PSU?<br>2. Komt de CPU-socket overeen met de moederbordsocket? | **Loop terug naar Stap 3:** Indien een onderdeel incompatibel is (bijv. PSU is te zwak), past de agent automatisch de selectie aan (kiest een zwaardere PSU) en voert de check opnieuw uit. |
| **Quality check / Reflection** (op Stap 9) | De LLM controleert het uiteindelijke voorstel op logica (bijvoorbeeld: er is niet per ongeluk een high-end videokaart gecombineerd met een zeer trage, verouderde processor die een bottleneck vormt). | De agent herschrijft of optimaliseert de componentenbalans indien er sprake is van een prestatie-bottleneck. |
