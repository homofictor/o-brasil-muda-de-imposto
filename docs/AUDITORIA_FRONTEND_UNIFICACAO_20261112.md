# Auditoria de unificação do frontend | 12/11/2026
## Diagnóstico observado
- Página inicial: título invisível devido a regra local `.hero h1{color:#102438}` em fundo escuro. Corrigido com regra de contraste explícita no CSS final.
- Página inicial: blocos Escopo analítico e Eixos de análise repetiam informações do hero e simulador. Removidos.
- Notícias eram apresentadas depois do simulador e das seções institucionais. Reordenadas para se tornarem primeira seção após a abertura.
- Páginas editoriais possuem CSS antigo disperso e declarações internas. Foi acrescentada uma camada compartilhada posterior, com tokens e controles de acessibilidade.
- Simulador V3.2, modo guiado, Simples Decisão e Motor RT Crédito 360 recebem uma camada visual separada, sem qualquer mudança nos scripts de cálculo.
## Inspirações aplicadas
- Portais públicos de administração tributária: hierarquia de normas, fontes e datas; sem linguagem comercial.
- Portais acadêmicos: fichas, autoria, referências bibliográficas, links ao artigo original.
- Publicações editoriais técnicas: manchete principal, notícias contextualizadas e textos com legibilidade.
- Plataformas de simulação públicas: distinção evidente entre metodologia, premissas e resultado.
## Escopo aplicado
**Páginas editoriais:** home, atualizações, notícias, radar de novembro, biblioteca acadêmica, Quem somos, autor, mitos, comunidade, diretrizes, feedback, privacidade e cinco guias temáticos.
**Ferramentas:** Simulador V3.2, Simulador guiado, manual, Simples Decisão e Motor RT Crédito 360.
**Rotas técnicas e legadas sem reformulação de interface:** callbacks de autenticação, APIs, páginas de redirecionamento, módulos de bolsa e Empresa 360 com identidade própria e sem exposição no menu institucional. Evitar mudanças de risco fora do projeto editorial.
## Restrições
- Não modificar JS de fórmulas, seletores de formulário, IDs, banco, segurança, contratos de API ou conteúdo normativo.
- Priorizar legibilidade, responsividade e contraste; não simular avaliações nem afirmar acessibilidade WCAG sem teste de dispositivo real.
- Imagem principal SVG original sem licença externa; outras imagens reutilizam acervo já publicado. Autoria e direitos do acervo fotográfico continuam sujeitos à documentação existente.
- Manter desativado `git.deploymentEnabled` na Vercel e efetuar um único deploy consolidado.
## Testes necessários
1. Documentos e seus estilos existem; CSS carregado por último.
2. O hero fica com título branco e notícia vem antes do simulador.
3. Os 4 cartões de Eixos desaparecem.
4. Simulador e todas as partials e scripts originais são preservados.
5. Testes funcionais no navegador e responsividade requerem inspeção de produção. Estados de execução do GitHub e Vercel devem ser lidos separadamente.
