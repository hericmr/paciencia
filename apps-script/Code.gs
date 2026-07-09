// Google Apps Script — backend do ranking do jogo "Paciência Serviço Social".
// Cole isto em Extensões > Apps Script na planilha, depois Implantar > Nova
// implantação > App da Web (Executar como: Eu / Quem acessa: Qualquer pessoa).
// A aba "Ranking" precisa existir com o cabeçalho:
// player_name | phase_id | phase_name | time_ms | created_at

const SHEET_NAME = 'Ranking';

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  let data;

  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid JSON'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const timestamp = new Date();

  // Adiciona a nova linha com a tentativa
  sheet.appendRow([
    data.player_name,
    data.phase_id,
    data.phase_name,
    data.time_ms,
    timestamp
  ]);

  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Remove a linha de cabeçalho

  const phaseFilter = e.parameter.phase;
  const limit = parseInt(e.parameter.limit) || 10;

  if (!phaseFilter) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Parâmetro phase é obrigatório'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Filtra apenas as linhas da fase solicitada
  const filtered = data.filter(row => row[1] == phaseFilter);

  // Agrupa pelo jogador para pegar apenas o melhor tempo de cada um
  const playerBestTimes = {};
  filtered.forEach(row => {
    const player = row[0];
    const time = Number(row[3]);
    const phaseName = row[2];
    const date = row[4];

    if (!playerBestTimes[player] || time < playerBestTimes[player].time_ms) {
      playerBestTimes[player] = {
        player_name: player,
        phase_id: phaseFilter,
        phase_name: phaseName,
        time_ms: time,
        created_at: date
      };
    }
  });

  // Converte para array, ordena do menor para o maior tempo e corta no limite (Top 10)
  let results = Object.values(playerBestTimes);
  results.sort((a, b) => a.time_ms - b.time_ms);
  results = results.slice(0, limit);

  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}
