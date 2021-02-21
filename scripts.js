const Modal = {
  isOpen: false,

  toggle(modal) {
    action = this.isOpen ? 'remove' : 'add';
    this.isOpen = !this.isOpen;
    document.querySelector(modal)
      .classList[action]('active');
  }
}

const Storage = {
  get() {
    return JSON.parse(localStorage.getItem('dev.finances:transactions')) || [];
  },

  set(transactions) {
    localStorage.setItem('dev.finances:transactions', JSON.stringify(transactions));
  }
}

const Transaction = {
  all: Storage.get(),

  add(transaction) {
    Transaction.all.push(transaction);

    App.reload();
  },

  update(index, data, elementId) {
    Transaction.all.forEach((transaction, i) => {
      if (index === i) {
        if (elementId == 'amount') {
          data = Utils.convertCurrencyToNumber(data);
        }
        transaction[elementId] = data;
      }
    });
    App.reload();
  },

  remove(index) {
    Transaction.all.splice(index, 1);

    App.reload();
  },

  removeAll() {
    Transaction.all = Transaction.all.splice();

    App.reload();
  },

  incomes() {
    let income = 0;
    Transaction.all.forEach((transaction) => {
      if (transaction.amount > 0) {
        income += transaction.amount;
      }
    });
    return income;
  },

  expenses() {
    let expense = 0;
    Transaction.all.forEach((transaction) => {
      if (transaction.amount < 0) {
        expense += transaction.amount;
      }
    });
    return expense;
  },

  total() {
    return Transaction.incomes() + Transaction.expenses();
  }
}

const DOM = {
  transactionContainer: document.querySelector('#data-table tbody'),

  addTransaction(transaction, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;
    DOM.transactionContainer.appendChild(tr);

  },

  innerHTMLTransaction(transaction, index) {
    const CSSclass = transaction.amount > 0 ? "income" : "expense";

    const amount = Utils.formatCurrency(transaction.amount);

    const html = `
        <td class="description"><span onclick="DOM.editTitle(event,${index})" id="description"> ${transaction.description} </span></td>
        <td class="${CSSclass}"><span onclick="DOM.editTitle(event,${index})" id="amount"> ${amount} </span></td>
        <td class="date"><span onclick="DOM.editTitle(event,${index})" id="date"> ${transaction.date} </span></td>
        <td>
          <img onclick="Transaction.remove(${index})" src="assets/minus.svg" alt="Remover Transação">
        </td>
    `
    return html;
  },

  editTitle(event, index) {
    let isInputChange = false;
    const elementId = event.target.id;
    const title = event.target;
    const span = title;

    if (title == null) return;

    span.onmouseout = function () {
      this.title = '';
      this.style.background = '';
    }

    span.onclick = function () {
      const textoAtual = this.firstChild.nodeValue.trim();
      const input = `<input type="${elementId == 'date' ? 'date' : 'text'}" name="1" value="${textoAtual}">`;

      this.innerHTML = input;
      const field = this.firstChild;
      this.onclick = null;
      this.onmouseover = null;

      field.oninput = function () {
        isInputChange = true;
      }

      field.focus();
      field.select();
      field.onblur = function () {
        let data;
        if (elementId == 'date') {
          data = isInputChange ? Utils.formatDate(this.value) : textoAtual;
        } else {
          data = this.value;
        }

        this.parentNode.innerHTML = data;
        Transaction.update(index, data, elementId);
        DOM.editTitle(event);
      }
    }
  },

  updateBalance() {
    document.getElementById('incomeDisplay').innerHTML = Utils.formatCurrency(Transaction.incomes());
    document.getElementById('expenseDisplay').innerHTML = Utils.formatCurrency(Transaction.expenses());
    document.getElementById('totalDisplay').innerHTML = Utils.formatCurrency(Transaction.total());
  },

  crearTransactions() {
    DOM.transactionContainer.innerHTML = '';
  },

  hideElements() {
    let display;
    if (Transaction.all.length == 0) {
      display = 'none';
    } else {
      display = 'block';
    }

    document.querySelectorAll('.visible').forEach(element => {
      element.style.display = display;
    });
  }
}

const PDF = {
  doc: new jsPDF(),
  headers: [
    'Data',
    'Descrição',
    'Valor',
  ],

  setDataPdf() {
    const data = [];
    const income = Utils.formatCurrency(Transaction.incomes())
    const expense = Utils.formatCurrency(Transaction.expenses());
    const total = Utils.formatCurrency(Transaction.total());
    const option = {
      year: 'numeric',
      month: 'long',
      weekday: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    const date = new Date().toLocaleDateString('pt-br', option);
    
    Transaction.all.forEach((transaction) => {
      data.push({
        'Data': transaction.date,
        'Descrição': transaction.description,
        'Valor': Utils.formatCurrency(transaction.amount),
      })
    });

    this.doc.setFontSize(33);
    this.doc.text(10, 20, 'Dev.finance$');

    this.doc.table(10, 40, data, this.headers, { autoSize: true, fontSize: 10 });
    this.doc.setFontSize(11);
    this.doc.text(165, 250, "Entradas:");
    this.doc.setFontSize(9);
    this.doc.text(185, 250, income);

    this.doc.setFontSize(11);
    this.doc.text(168, 260, "Saídas:");
    this.doc.setFontSize(9);
    this.doc.text(185, 260, expense);

    this.doc.setFontSize(11);
    this.doc.text(172, 270, "Total:");
    this.doc.setFontSize(9);
    this.doc.text(185, 270, total);

    this.doc.setFontSize(8);
    this.doc.text(75, 285, date);

    this.doc.setFontSize(6);
    this.doc.text(80, 290, 'https://www.linkedin.com/in/mnlima17/');
  },

  generatePDF() {
    let download = document.getElementById('download').checked;
    let resetTable = document.getElementById('resetTable').checked;

    this.setDataPdf();

    if (download) {
      this.doc.save('dev.finance.pdf');
      Modal.toggle('.generate-PDF');
    } else {
      window.open(this.doc.output('bloburl', 'dev.finance.pdf'));
    }

    if (resetTable) {
      Transaction.removeAll();
    }
  },
}

const Utils = {
  formatAmount(value) {
    value = value * 100;

    return Math.round(value);
  },

  formatDate(date) {
    const splittedDate = date.split('-');
    return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[1]}`;
  },

  formatCurrency(value) {
    const signal = Number(value) < 0 ? '-' : '';
    value = String(value).replace(/\D/g, '');
    value = Number(value) / 100;
    value = value.toLocaleString("pt-BR", {
      style: 'currency',
      currency: 'BRL'
    })
    return (signal + value);
  },

  convertCurrencyToNumber(value) {
    const signal = value.indexOf('-') >= 0 ? -1 : 1;
    value = String(value).replace(/\D/g, '');
    return Math.round(value * signal);
  }
}

const Form = {
  description: document.querySelector('#description'),
  amount: document.querySelector('#amount'),
  date: document.querySelector('#date'),

  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value,
    }
  },

  validateFields() {
    const { description, amount, date } = Form.getValues();
    if (description.trim() === "" || amount.trim() === "" || date.trim() === "") {
      throw new Error("Por Favor, Preencha todos os campos");
    }
  },

  formatValues() {
    let { description, amount, date } = Form.getValues();

    amount = Utils.formatAmount(amount);
    date = Utils.formatDate(date);

    return { description, amount, date };
  },

  saveTransaction(transaction) {
    Transaction.add(transaction);
  },

  clearFields() {
    Form.description.value = '';
    Form.amount.value = '';
    Form.date.value = '';
  },

  submit(event) {
    event.preventDefault();

    try {
      Form.validateFields();
      const transaction = Form.formatValues();
      Transaction.add(transaction);
      Form.clearFields();
      Modal.toggle('.new-transaction');
    } catch (error) {
      alert(error.message);
    }
  }
}

const App = {
  init() {
    Transaction.all.forEach((transaction, index) => {
      DOM.addTransaction(transaction, index);
    });

    DOM.updateBalance();

    Storage.set(Transaction.all);

    DOM.hideElements();
  },

  reload() {
    DOM.crearTransactions();
    App.init();
  }
}

App.init();
