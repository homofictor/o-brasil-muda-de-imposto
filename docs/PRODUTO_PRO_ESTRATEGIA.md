# O Brasil muda de imposto PRO

## Diretriz comercial aprovada

O produto deixa de ser comunicado apenas como um livro. A proposta principal passa a ser uma solução profissional formada por conteúdo, ferramenta e atualização contínua durante a transição da Reforma Tributária.

### Posicionamento

Mensagem central:

**Uma Reforma que muda durante anos exige um livro que continue atualizado.**

Promessa principal:

**O Brasil muda de imposto PRO combina o conteúdo do livro com acesso ao Simulador da Reforma Tributária e a um ambiente digital atualizado à medida que a regulamentação evoluir.**

Evitar a expressão "acesso vitalício". A formulação preferencial é:

**Acesso contínuo ao Simulador e às atualizações do ambiente digital durante o período de implantação e transição da Reforma Tributária, atualmente previsto até 2033.**

## Arquitetura de produtos e preços

### Kindle

Preço de referência: R$ 29,90 a R$ 31,90.

Função: porta de entrada, autoridade, alcance e aquisição de leitores pela Amazon.

### Livro impresso brochura

Preço de referência: R$ 69,90.

Função: produto físico autônomo, referência profissional e opção de presente corporativo.

O comprador do impresso recebe acesso ao conteúdo público e atualizado do site, mas não ao simulador completo apenas pela compra do livro físico.

### Capa dura

Preço de referência: R$ 99,90.

Função: edição física premium.

### PRO

Preço de lançamento: R$ 147.

Preço normal de referência: R$ 197.

Inclui:

- acesso ao conteúdo digital da obra
- acesso ao Simulador da Reforma Tributária
- atualizações do ambiente digital durante a transição da Reforma
- melhorias e correções do núcleo do simulador vinculadas à proposta da obra

### PRO + brochura

Preço de lançamento sugerido: R$ 197.

### PRO + capa dura

Preço sugerido: R$ 227 a R$ 247.

## Princípio de acesso

O comprador do PRO deve ter conta individual. O acesso ao simulador será pessoal e não transferível.

A autenticação deve ser feita por e-mail, preferencialmente com código de acesso ou magic link, evitando a criação e recuperação de senhas tradicionais.

O acesso ao núcleo do simulador e às atualizações vinculadas ao livro permanece ativo durante a transição da Reforma Tributária, conforme a promessa comercial vigente.

Recursos profissionais futuros que gerem custo operacional elevado podem ser oferecidos em planos adicionais, sem retirar do comprador do PRO os recursos incluídos no momento da compra.

## Separação entre núcleo incluído e recursos profissionais futuros

### Núcleo incluído no PRO

- simulador principal
- atualização de alíquotas e regras
- cronograma da transição
- comparação básica entre regimes
- atualizações legislativas e explicativas
- manutenção das funcionalidades prometidas no momento da compra

### Recursos profissionais futuros, passíveis de cobrança adicional

- importação avançada de balanço e DRE
- leitura automática de documentos em grande volume
- consultas de CNPJ e CNAE com APIs pagas
- relatórios avançados em PDF
- histórico amplo de simulações
- múltiplas empresas por conta
- uso por equipes e escritórios
- integrações com sistemas contábeis
- automações com inteligência artificial que gerem custo relevante por uso

## Estratégia de venda

A Amazon continua como principal porta de entrada para Kindle e impresso.

O PRO deve ser vendido diretamente pelo site oficial para permitir identificação do comprador, criação automática de conta, pagamento por Pix e cartão, relacionamento posterior e controle de acesso.

O site deve apresentar três caminhos claros:

1. Quero apenas o livro
2. Quero o PRO com simulador e atualizações
3. Quero o PRO com livro físico

## Mensagens prioritárias

### Headline principal

**O livro que não para na última página.**

### Apoio

**Livro + Simulador + Atualizações da Reforma Tributária.**

### Objeção central

**A Reforma Tributária vai mudar. Seu conteúdo de referência também precisa acompanhar essas mudanças.**

### Chamada de valor

**Leia. Simule. Compare. Decida.**

## Regras para o impresso

O livro impresso deve conter QR Code e endereço do ambiente digital da obra.

A redação sugerida é:

**Este livro continua na internet. Acesse conteúdos atualizados, acompanhe a evolução da Reforma Tributária e conheça o Simulador O Brasil muda de imposto.**

O impresso pode receber o selo:

**EDIÇÃO INTEGRADA AO AMBIENTE DIGITAL**

**Conteúdo complementar e atualizações online**

O PRO completo não deve ser liberado automaticamente para toda compra avulsa da brochura ou capa dura na Amazon, pois isso eliminaria a diferenciação econômica do produto premium.

## Roadmap de implementação

### Fase 1: posicionamento e oferta

- criar página comercial do PRO no site
- reorganizar os CTAs da página inicial
- apresentar claramente Kindle, impresso e PRO
- inserir FAQ sobre atualizações, acesso e escopo
- preparar banners de lançamento com a nova proposta de valor

### Fase 2: autenticação e banco de dados

- conectar Supabase
- criar tabela de usuários e licenças
- implementar login por e-mail
- registrar tipo de produto adquirido
- controlar status da licença
- criar painel administrativo básico

### Fase 3: pagamento

- escolher gateway com Pix e cartão para o Brasil
- criar checkout do PRO
- processar confirmação de pagamento por webhook
- ativar conta automaticamente após pagamento confirmado
- emitir e-mail de boas-vindas e instruções de acesso

### Fase 4: proteção do simulador

- exigir sessão autenticada para abrir o simulador completo
- verificar licença ativa no servidor
- impedir acesso apenas pela descoberta da URL
- registrar acessos e erros relevantes
- permitir suspensão administrativa em caso de abuso

### Fase 5: atualização editorial

- incluir no Kindle e no impresso referência ao ambiente digital
- inserir QR Code para o site oficial
- revisar contracapa e páginas iniciais
- adequar descrição da Amazon sem prometer recursos externos de forma incompatível com as políticas da plataforma

### Fase 6: lançamento comercial

- lançamento nacional no LinkedIn, Facebook e Instagram
- campanha interna no banco apenas como ação complementar
- página PRO como destino principal das campanhas premium
- Amazon como destino principal das campanhas de livro avulso
- preço inicial do PRO: R$ 147
- preço normal planejado: R$ 197

## Critério de sucesso

O site deve deixar de ser apenas uma página promocional do livro e passar a funcionar como plataforma oficial da obra, reunindo conteúdo atualizado, ferramenta de simulação, venda do PRO e relacionamento com os compradores durante a transição da Reforma Tributária.
