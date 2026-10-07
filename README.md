# RotaExpress - Sistema de Gestão de Encomendas e Frete

## Identificação

- **Nome:** Pedro Henrique Silva Sallorenzo
- **Matrícula:** 22505884
- **Disciplina:** Desenvolvimento Web
- **Instituição:** CEUB

## Tema escolhido

**Opção A — RotaExpress (Sistema de Gestão de Encomendas e Frete)**

Aplicação logística que permite cadastrar encomendas, calcular o valor do frete
automaticamente e acompanhar o status de cada entrega (Pendente → Em Trânsito → Entregue).

## Descrição resumida

O RotaExpress é uma aplicação web para uma transportadora fictícia. O usuário cadastra uma
encomenda informando o destinatário, o CEP de destino (que é consultado automaticamente na
API pública **ViaCEP** para preencher logradouro, bairro, cidade e UF), o número do endereço,
o peso em quilogramas e a modalidade de envio (Econômica, Padrão ou Expressa).

O sistema calcula o frete com base no peso e na modalidade, exibe a encomenda em um card na
listagem, permite avançar o status da entrega e excluir encomendas, além de manter indicadores
atualizados em tempo real: total de encomendas, quantidade em cada status e faturamento
acumulado.

## Tecnologias usadas

- **HTML5** — estrutura semântica (`header`, `main`, `section`, `article`, `footer`) e
  formulário com validação nativa.
- **CSS3** — estilização 100% autoral, com variáveis (`:root`), Flexbox, CSS Grid e
  media queries responsivas (sem frameworks como Bootstrap/Tailwind).
- **JavaScript (ES6+)** — Programação Orientada a Objetos (classes com campos privados),
  manipulação de DOM e integração assíncrona com API externa via `fetch`/`async`/`await`.
  Sem bibliotecas externas (sem jQuery) e sem ES Modules (`import`/`export`), para que o
  projeto funcione abrindo o `index.html` diretamente no navegador.
- **API ViaCEP** (`https://viacep.com.br`) — consulta de endereço a partir do CEP informado.

## Regras de cálculo do frete

O frete é calculado pelo método `calcularFrete()` da classe `Encomenda`, seguindo a fórmula:

```
frete = (valorBase + pesoKg * valorPorKg) * multiplicadorModalidade
```

- **valorBase:** R$ 10,00 (custo fixo de manuseio e postagem).
- **valorPorKg:** R$ 2,00 (custo variável por quilo transportado).
- **Multiplicador por modalidade:**
  - **Econômica:** 1.0 (sem acréscimo, prazo de entrega mais longo).
  - **Padrão:** 1.3 (acréscimo de 30% pela prioridade intermediária).
  - **Expressa:** 2.0 (acréscimo de 100% pela urgência/prioridade máxima).

O **faturamento acumulado** exibido nos indicadores é a soma do valor de frete de todas as
encomendas já cadastradas no sistema, independentemente do status atual de cada uma.

## Guia rápido de execução

Não é necessário instalar nada — o projeto usa apenas HTML, CSS e JavaScript puros.

1. Abra a pasta `projeto01/`.
2. Dê duplo clique no arquivo `index.html` para abri-lo diretamente no navegador,
   **ou**, se estiver usando o VS Code, clique com o botão direito em `index.html` e
   selecione **"Open with Live Server"**.
3. Preencha o formulário de cadastro:
   - Digite o **CEP** (8 números) e saia do campo (clique em outro campo) para que o
     endereço seja buscado automaticamente na API ViaCEP.
   - Preencha destinatário, número, peso e modalidade.
   - Clique em **"Cadastrar encomenda"**.
4. Acompanhe os indicadores no topo e a listagem de encomendas, usando os botões
   **"Avançar status"** e **"Excluir"** em cada card.

> **Observação:** a busca de CEP depende de conexão com a internet, pois consome a API
> pública ViaCEP. Sem internet, o sistema exibe uma mensagem de erro informando a falha.

## Estrutura de arquivos

```
projeto01/
├── index.html       # Estrutura semântica e formulário
├── README.md         # Este arquivo
├── css/
│   └── style.css     # Estilização (Flexbox, Grid, variáveis, responsividade)
└── js/
    └── script.js      # Classes, lógica de negócio, DOM e integração com ViaCEP
```
