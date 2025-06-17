let tamanhoFonteAtual = 100;

function alterarFonte(acao) {
  if (acao === "+") {
    if (tamanhoFonteAtual < 110) {
      // Limite máximo de 200%
      tamanhoFonteAtual += 10;
    }
  } else if (acao === "-") {
    if (tamanhoFonteAtual > 50) {
      // Limite mínimo de 50%
      tamanhoFonteAtual -= 10;
    }
  } else if (acao === "reset") {
    tamanhoFonteAtual = 100;
  }

  document.body.style.fontSize = tamanhoFonteAtual + "%";
}
