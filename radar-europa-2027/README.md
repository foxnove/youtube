# Radar Europa 2027

Aplicativo: https://foxnove.github.io/youtube/radar-europa-2027/

Painel público em HTML/CSS/JavaScript com filtros de destino, mês, preço, voos diretos e ausência de conexão doméstica, comparação de temporadas e histórico por rota/período. O gráfico usa SVG sem biblioteca externa. Fontes têm fallback local.

O backend privado consulta a SerpApi Google Flights em produção e publica somente um snapshot de campos permitidos. Nenhum e-mail, chave, token, resposta bruta da API ou estado privado é publicado. A sincronização usa chave de deploy exclusiva deste repositório, protegida no backend.

Atualizar o painel relê o arquivo público; não executa uma pesquisa de voos. Resultados de teste e ofertas com mais de 24h não aparecem como tarifas válidas. As ofertas consultadas não são reservas ou preços garantidos. O link de consulta no Google Flights vem da API. Para economizar buscas, os detalhes da volta ficam a confirmar.

Origem SSA; janelas 20/02–31/03 e 01/07–31/08/2027. Destinos incluem LIS, MAD, CDG, ORY, OPO, FCO, MXP, BCN, FRA, AMS, ZAG, TIA e TBS; rotas adicionais BRU, DUB, LHR e VIE. Busca rotativa de datas e durações de 14, 18, 21 e 24 dias; cobertura parcial, limitada pela franquia configurada.

Estado real e pendências são apresentados no painel. A fonte ativa é SerpApi, com uma busca por rodada, intervalo mínimo de 6h e limites de 6 buscas/dia e 180/mês. O agendador mínimo do backend fica na branch padrão; o código executado permanece na branch do Radar. Alertas dependem da configuração privada do Gmail. Preço de ida e volta; filtros de escalas e conexões consideram a ida, pois os detalhes da volta não são consultados para economizar.

Teste: `node --test radar-europa-2027/test-app.cjs`. Dados dentro do teste são fixtures isoladas; não são usados pelo aplicativo nem exportados no JSON.
