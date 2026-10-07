// Representa uma encomenda. O status é privado e só muda por avancarStatus().
class Encomenda {
  #status = "Pendente";

  constructor(destinatario, pesoKg, modalidade, endereco) {
    this.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.destinatario = destinatario;
    this.pesoKg = pesoKg;
    this.modalidade = modalidade;
    this.endereco = endereco;
    this.frete = this.calcularFrete();
  }

  get status() {
    return this.#status;
  }

  // Avança Pendente -> Em Trânsito -> Entregue. Em Entregue, não avança mais.
  avancarStatus() {
    if (this.#status === "Pendente") {
      this.#status = "Em Trânsito";
    } else if (this.#status === "Em Trânsito") {
      this.#status = "Entregue";
    }
    return this.#status;
  }

  // Frete = (valorBase + peso * valorPorKg) * multiplicador da modalidade.
  // Base R$10 + R$2/kg; multiplicador: Econômica 1.0, Padrão 1.3, Expressa 2.0.
  calcularFrete() {
    const valorBase = 10;
    const valorPorKg = 2;

    const multiplicadores = {
      "Econômica": 1.0,
      "Padrão": 1.3,
      "Expressa": 2.0,
    };

    const multiplicador = multiplicadores[this.modalidade] ?? 1.0;
    return (valorBase + this.pesoKg * valorPorKg) * multiplicador;
  }

  // Valida se o CEP tem exatamente 8 dígitos.
  static validarCep(cep) {
    return /^\d{8}$/.test(cep);
  }

  // Formata um número como moeda brasileira (R$).
  static formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }
}

// Guarda as encomendas cadastradas. A lista é privada; listar() devolve uma cópia.
class GerenciadorLogistica {
  #encomendas = [];

  cadastrar(encomenda) {
    this.#encomendas.push(encomenda);
    return encomenda;
  }

  remover(id) {
    const tamanhoAnterior = this.#encomendas.length;
    this.#encomendas = this.#encomendas.filter((encomenda) => encomenda.id !== id);
    return this.#encomendas.length < tamanhoAnterior;
  }

  avancarStatus(id) {
    const encomenda = this.#encomendas.find((item) => item.id === id);
    if (!encomenda) return null;
    return encomenda.avancarStatus();
  }

  listar() {
    return [...this.#encomendas];
  }

  contarPorStatus(status) {
    return this.#encomendas.filter((encomenda) => encomenda.status === status).length;
  }

  get total() {
    return this.#encomendas.length;
  }

  // Faturamento = soma do frete de todas as encomendas cadastradas.
  get faturamento() {
    return this.#encomendas.reduce((soma, encomenda) => soma + encomenda.frete, 0);
  }
}

// Busca o endereço de um CEP na API ViaCEP. Lança erro em CEP inválido,
// CEP inexistente, falha de rede ou resposta HTTP que não seja "ok".
const buscarEnderecoPorCep = async (cep) => {
  if (!Encomenda.validarCep(cep)) {
    throw new Error("CEP inválido. Informe exatamente 8 números.");
  }

  let resposta;
  try {
    resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  } catch (erroDeRede) {
    throw new Error("Falha de conexão. Verifique sua internet e tente novamente.");
  }

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar o CEP (HTTP ${resposta.status}).`);
  }

  const dados = await resposta.json();

  if (dados.erro) {
    throw new Error("CEP não encontrado.");
  }

  return dados;
};

// Integração com o DOM

const gerenciador = new GerenciadorLogistica();

const formulario = document.getElementById("form-encomenda");
const campoCep = document.getElementById("cep");
const campoLogradouro = document.getElementById("logradouro");
const campoBairro = document.getElementById("bairro");
const campoCidade = document.getElementById("cidade");
const campoUf = document.getElementById("uf");
const campoDestinatario = document.getElementById("destinatario");
const campoNumero = document.getElementById("numero");
const campoPeso = document.getElementById("peso");
const campoModalidade = document.getElementById("modalidade");

const statusCep = document.getElementById("status-cep");
const mensagemErro = document.getElementById("mensagem-erro");
const listaEncomendas = document.getElementById("lista-encomendas");

const indicadorTotal = document.getElementById("indicador-total");
const indicadorPendentes = document.getElementById("indicador-pendentes");
const indicadorTransito = document.getElementById("indicador-transito");
const indicadorEntregues = document.getElementById("indicador-entregues");
const indicadorFaturamento = document.getElementById("indicador-faturamento");

// Endereço validado da última busca de CEP bem-sucedida.
let enderecoAtual = null;

const exibirErro = (texto) => {
  mensagemErro.textContent = texto;
};

const obterClasseStatus = (status) => {
  if (status === "Pendente") return "status-pendente";
  if (status === "Em Trânsito") return "status-em-transito";
  return "status-entregue";
};

const obterClasseModalidade = (modalidade) => {
  if (modalidade === "Econômica") return "card--economica";
  if (modalidade === "Expressa") return "card--expressa";
  return "card--padrao";
};

// Monta o card de uma encomenda com createElement (sem innerHTML, evita XSS).
const criarCardEncomenda = (encomenda) => {
  const card = document.createElement("article");
  card.className = `card-encomenda ${obterClasseModalidade(encomenda.modalidade)}`;
  card.dataset.id = encomenda.id;

  const cabecalho = document.createElement("div");
  cabecalho.className = "card-cabecalho";

  const nomeDestinatario = document.createElement("span");
  nomeDestinatario.className = "card-destinatario";
  nomeDestinatario.textContent = encomenda.destinatario;

  const selosModalidade = document.createElement("span");
  selosModalidade.className = "card-modalidade";
  selosModalidade.textContent = encomenda.modalidade;

  cabecalho.append(nomeDestinatario, selosModalidade);

  const { logradouro, numero, bairro, cidade, uf, cep } = encomenda.endereco;
  const infoEndereco = document.createElement("p");
  infoEndereco.className = "card-info";
  infoEndereco.textContent = `${logradouro}, ${numero} - ${bairro}, ${cidade}/${uf} - CEP ${cep}`;

  const infoPeso = document.createElement("p");
  infoPeso.className = "card-info";
  infoPeso.textContent = `Peso: ${encomenda.pesoKg} kg`;

  const infoFrete = document.createElement("p");
  infoFrete.className = "card-frete";
  infoFrete.textContent = `Frete: ${Encomenda.formatarMoeda(encomenda.frete)}`;

  const seloStatus = document.createElement("span");
  seloStatus.className = `card-status ${obterClasseStatus(encomenda.status)}`;
  seloStatus.textContent = encomenda.status;

  const acoes = document.createElement("div");
  acoes.className = "card-acoes";

  const botaoAvancar = document.createElement("button");
  botaoAvancar.type = "button";
  botaoAvancar.className = "botao botao-avancar";
  botaoAvancar.textContent = "Avançar status";
  botaoAvancar.disabled = encomenda.status === "Entregue";
  botaoAvancar.addEventListener("click", () => {
    gerenciador.avancarStatus(encomenda.id);
    renderizarEncomendas();
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "botao botao-excluir";
  botaoExcluir.textContent = "Excluir";
  botaoExcluir.addEventListener("click", () => {
    gerenciador.remover(encomenda.id);
    card.remove();
    atualizarIndicadores();
    verificarListaVazia();
  });

  acoes.append(botaoAvancar, botaoExcluir);

  card.append(cabecalho, infoEndereco, infoPeso, infoFrete, seloStatus, acoes);

  return card;
};

// Mostra/esconde a mensagem de lista vazia conforme o total de encomendas.
const verificarListaVazia = () => {
  const jaTemMensagem = document.getElementById("mensagem-vazia");

  if (gerenciador.total === 0 && !jaTemMensagem) {
    const mensagem = document.createElement("p");
    mensagem.id = "mensagem-vazia";
    mensagem.className = "mensagem-vazia";
    mensagem.textContent = "Nenhuma encomenda cadastrada ainda.";
    listaEncomendas.appendChild(mensagem);
  }

  if (gerenciador.total > 0 && jaTemMensagem) {
    jaTemMensagem.remove();
  }
};

const atualizarIndicadores = () => {
  indicadorTotal.textContent = gerenciador.total;
  indicadorPendentes.textContent = gerenciador.contarPorStatus("Pendente");
  indicadorTransito.textContent = gerenciador.contarPorStatus("Em Trânsito");
  indicadorEntregues.textContent = gerenciador.contarPorStatus("Entregue");
  indicadorFaturamento.textContent = Encomenda.formatarMoeda(gerenciador.faturamento);
};

const renderizarEncomendas = () => {
  listaEncomendas.replaceChildren();

  gerenciador.listar().forEach((encomenda) => {
    listaEncomendas.appendChild(criarCardEncomenda(encomenda));
  });

  verificarListaVazia();
  atualizarIndicadores();
};

const limparCamposEndereco = () => {
  campoLogradouro.value = "";
  campoBairro.value = "";
  campoCidade.value = "";
  campoUf.value = "";
  enderecoAtual = null;
};

// Dispara a busca de CEP ao sair do campo (blur).
const tratarBuscaCep = async () => {
  const cep = campoCep.value.trim();

  exibirErro("");
  limparCamposEndereco();

  if (cep === "") {
    return;
  }

  if (!Encomenda.validarCep(cep)) {
    exibirErro("CEP inválido. Digite exatamente 8 números.");
    return;
  }

  statusCep.textContent = "Buscando CEP...";

  try {
    const dados = await buscarEnderecoPorCep(cep);

    campoLogradouro.value = dados.logradouro;
    campoBairro.value = dados.bairro;
    campoCidade.value = dados.localidade;
    campoUf.value = dados.uf;

    enderecoAtual = {
      cep,
      logradouro: dados.logradouro,
      bairro: dados.bairro,
      cidade: dados.localidade,
      uf: dados.uf,
    };
  } catch (erro) {
    exibirErro(erro.message);
    limparCamposEndereco();
  } finally {
    statusCep.textContent = "";
  }
};

// Cadastra a encomenda ao enviar o formulário, sem recarregar a página.
const tratarSubmitFormulario = (evento) => {
  evento.preventDefault();
  exibirErro("");

  if (!enderecoAtual) {
    exibirErro("Busque um CEP válido antes de cadastrar a encomenda.");
    return;
  }

  const destinatario = campoDestinatario.value.trim();
  const numero = campoNumero.value.trim();
  const pesoKg = parseFloat(campoPeso.value);
  const modalidade = campoModalidade.value;

  if (destinatario.length < 3) {
    exibirErro("Informe o nome completo do destinatário.");
    return;
  }

  if (numero === "") {
    exibirErro("Informe o número do endereço.");
    return;
  }

  if (Number.isNaN(pesoKg) || pesoKg < 0.1) {
    exibirErro("Informe um peso válido (mínimo 0.1 kg).");
    return;
  }

  const enderecoCompleto = { ...enderecoAtual, numero };
  const novaEncomenda = new Encomenda(destinatario, pesoKg, modalidade, enderecoCompleto);

  gerenciador.cadastrar(novaEncomenda);
  renderizarEncomendas();

  formulario.reset();
  campoModalidade.value = "Padrão";
  limparCamposEndereco();
};

campoCep.addEventListener("blur", tratarBuscaCep);
formulario.addEventListener("submit", tratarSubmitFormulario);

verificarListaVazia();
atualizarIndicadores();
