const Pedido = require('../models/pedidoModels.js');
const Produto = require('../models/produtoModels.js');
const db = require('../config/db');

const HORARIOS_FUNCIONAMENTO = {
  aberto: { hora: 0, minuto: 1 }, // 00:01
  fechado: { hora: 23, minuto: 59 } // 23:59
};

const pedidoController = {
  getStoreStatus: async (req, res) => {
    try {
      const agora = new Date();
      const horaAtual = agora.getHours() * 60 + agora.getMinutes();
      const minutosAbertura = HORARIOS_FUNCIONAMENTO.aberto.hora * 60 + HORARIOS_FUNCIONAMENTO.aberto.minuto;
      const minutosFechamento = HORARIOS_FUNCIONAMENTO.fechado.hora * 60 + HORARIOS_FUNCIONAMENTO.fechado.minuto;
      const estaAberto = horaAtual >= minutosAbertura && horaAtual <= minutosFechamento;
      res.status(200).json({
        aberto: estaAberto,
        horario: {
          abertura: `${HORARIOS_FUNCIONAMENTO.aberto.hora.toString().padStart(2, '0')}:${HORARIOS_FUNCIONAMENTO.aberto.minuto.toString().padStart(2, '0')}`,
          fechamento: `${HORARIOS_FUNCIONAMENTO.fechado.hora.toString().padStart(2, '0')}:${HORARIOS_FUNCIONAMENTO.fechado.minuto.toString().padStart(2, '0')}`
        }
      });
    } catch (err) {
      console.error('Erro ao obter status da loja:', err);
      res.status(500).json({ message: 'Erro ao obter status da loja', error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { user_id, itens, endereco } = req.body;
      if (!user_id || !itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ message: 'Dados inválidos para criar pedido' });
      }
      if (!endereco || !endereco.nome_rua || !endereco.numero_casa || !endereco.bairro || !endereco.cidade || !endereco.UF) {
        return res.status(400).json({ message: 'Endereço completo é obrigatório' });
      }
      if (!/^\d+$/.test(endereco.numero_casa) || parseInt(endereco.numero_casa) <= 0) {
        return res.status(400).json({ message: 'Número da residência deve ser um número inteiro positivo' });
      }
      if (!/^[A-Z]{2}$/.test(endereco.UF)) {
        return res.status(400).json({ message: 'UF deve conter exatamente 2 letras maiúsculas' });
      }
      if (!endereco.nome_rua.trim() || !endereco.bairro.trim() || !endereco.cidade.trim()) {
        return res.status(400).json({ message: 'Rua, bairro e cidade não podem estar vazios' });
      }

      // Verificar horário de funcionamento
      const agora = new Date();
      const horaAtual = agora.getHours() * 60 + agora.getMinutes();
      const minutosAbertura = HORARIOS_FUNCIONAMENTO.aberto.hora * 60 + HORARIOS_FUNCIONAMENTO.aberto.minuto;
      const minutosFechamento = HORARIOS_FUNCIONAMENTO.fechado.hora * 60 + HORARIOS_FUNCIONAMENTO.fechado.minuto;
      if (horaAtual < minutosAbertura || horaAtual > minutosFechamento) {
        return res.status(403).json({ message: 'A loja está fechada. Não é possível fazer pedidos agora.' });
      }

      // Verificar e reduzir estoque
      let valor_total = 0;
      for (const item of itens) {
        const [produto] = await Produto.findById(item.produto_id);
        if (!produto) {
          return res.status(404).json({ message: `Produto ${item.produto_id} não encontrado` });
        }
        if (item.quantidade <= 0) {
          return res.status(400).json({ message: `Quantidade inválida para o produto ${item.produto_id}` });
        }
        if (produto.quantidade_estoque < item.quantidade) {
          return res.status(400).json({ message: `Estoque insuficiente para o produto ${produto.titulo}` });
        }
        valor_total += produto.preco * item.quantidade;
      }

      // Iniciar transação para garantir consistência
      await new Promise((resolve, reject) => {
        db.query('START TRANSACTION', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      try {
        // Criar pedido
        const pedidoResult = await new Promise((resolve, reject) => {
          Pedido.createPedido(user_id, valor_total, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        const pedido_id = pedidoResult.insertId;

        // Adicionar itens ao pedido
        for (const item of itens) {
          await new Promise((resolve, reject) => {
            Pedido.addItem(pedido_id, item.produto_id, item.quantidade, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          });
        }

        // Reduzir estoque
        for (const item of itens) {
          const [produto] = await Produto.findById(item.produto_id);
          const novoEstoque = produto.quantidade_estoque - item.quantidade;
          await new Promise((resolve, reject) => {
            db.query(
              'UPDATE produtos SET quantidade_estoque = ? WHERE produto_id = ?',
              [novoEstoque, item.produto_id],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
          });
        }

        // Confirmar transação
        await new Promise((resolve, reject) => {
          db.query('COMMIT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        res.status(201).json({ pedido_id, user_id, itens, valor_total, endereco });
      } catch (err) {
        // Reverter transação em caso de erro
        await new Promise((resolve) => {
          db.query('ROLLBACK', () => resolve());
        });
        throw err;
      }
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      res.status(500).json({ message: 'Erro ao criar pedido', error: err.message });
    }
  },

  findAll: async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        nomeCliente: req.query.nomeCliente,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        valorMinimo: req.query.valorMinimo ? parseFloat(req.query.valorMinimo) : null,
        valorMaximo: req.query.valorMaximo ? parseFloat(req.query.valorMaximo) : null,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await new Promise((resolve, reject) => {
        Pedido.findAll(filters, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      const pedidosComEndereco = await Promise.all(result.pedidos.map(async (pedido) => {
        let endereco = null;
        try {
          const [perfil] = await new Promise((resolve, reject) => {
            db.query('SELECT nome_rua, numero_casa, bairro, cidade, UF FROM perfil WHERE user_id = ?', [pedido.user_id], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          if (perfil) {
            endereco = {
              nome_rua: perfil.nome_rua,
              numero_casa: perfil.numero_casa,
              bairro: perfil.bairro,
              cidade: perfil.cidade,
              UF: perfil.UF
            };
          }
        } catch (err) {
          console.error(`Erro ao buscar endereço para o pedido ${pedido.pedido_id}:`, err);
        }
        return { ...pedido, endereco };
      }));

      res.status(200).json({
        pedidos: pedidosComEndereco,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } catch (err) {
      console.error('Erro ao listar pedidos:', err);
      res.status(500).json({ message: 'Erro ao listar pedidos', error: err.message });
    }
  },

  findByUser: async (req, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const filters = { userId };

      const pedidos = await new Promise((resolve, reject) => {
        Pedido.findAll(filters, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      res.status(200).json(pedidos);
    } catch (err) {
      console.error('Erro ao listar pedidos do usuário:', err);
      res.status(500).json({ message: 'Erro ao listar pedidos do usuário', error: err.message });
    }
  },

  findById: async (req, res) => {
    try {
      const { id } = req.params;
      const pedidos = await new Promise((resolve, reject) => {
        Pedido.findById(id, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (!pedidos || pedidos.length === 0) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      const pedido = {
        pedido_id: pedidos[0].pedido_id,
        user_id: pedidos[0].user_id,
        processo_pedido: pedidos[0].processo_pedido,
        valor_total: Number(pedidos[0].valor_total) || 0,
        data_pedido: pedidos[0].data_pedido,
        itens: []
      };

      for (const row of pedidos) {
        if (row.produto_id) {
          const [produto] = await Produto.findById(row.produto_id);
          if (produto) {
            pedido.itens.push({
              produto_id: row.produto_id,
              quantidade: row.quantidade,
              titulo: produto.titulo,
              preco_unitario: Number(produto.preco) || 0
            });
          }
        }
      }

      try {
        const [perfil] = await new Promise((resolve, reject) => {
          db.query('SELECT nome_rua, numero_casa, bairro, cidade, UF FROM perfil WHERE user_id = ?', [pedido.user_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (perfil) {
          pedido.endereco = {
            nome_rua: perfil.nome_rua,
            numero_casa: perfil.numero_casa,
            bairro: perfil.bairro,
            cidade: perfil.cidade,
            UF: perfil.UF
          };
        } else {
          pedido.endereco = null;
        }
      } catch (err) {
        console.error('Erro ao buscar endereço do perfil:', err);
        pedido.endereco = null;
      }

      res.status(200).json(pedido);
    } catch (err) {
      console.error('Erro ao buscar pedido:', err);
      res.status(500).json({ message: 'Erro ao buscar pedido', error: err.message });
    }
  },

  updateStatus: async (req, res) => {
    const { id } = req.params;
    const { processo_pedido } = req.body;

    if (!['aguardando', 'concluido', 'cancelado'].includes(processo_pedido)) {
      return res.status(400).json({ message: 'Status inválido. Use: aguardando, concluido ou cancelado.' });
    }

    try {
      // Iniciar transação
      await new Promise((resolve, reject) => {
        db.query('START TRANSACTION', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      try {
        // Buscar o status atual do pedido
        const [pedido] = await new Promise((resolve, reject) => {
          db.query('SELECT processo_pedido FROM pedidos WHERE pedido_id = ?', [id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (!pedido) {
          await new Promise((resolve) => {
            db.query('ROLLBACK', () => resolve());
          });
          return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        const statusAtual = pedido.processo_pedido;

        // Restaurar estoque se o pedido for cancelado
        if (processo_pedido === 'cancelado' && statusAtual !== 'cancelado') {
          const itens = await new Promise((resolve, reject) => {
            db.query(
              'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = ?',
              [id],
              (err, results) => {
                if (err) reject(err);
                else resolve(results);
              }
            );
          });

          for (const item of itens) {
            const [produto] = await Produto.findById(item.produto_id);
            if (!produto) {
              await new Promise((resolve) => {
                db.query('ROLLBACK', () => resolve());
              });
              throw new Error(`Produto ${item.produto_id} não encontrado`);
            }

            const novoEstoque = produto.quantidade_estoque + item.quantidade;
            await new Promise((resolve, reject) => {
              db.query(
                'UPDATE produtos SET quantidade_estoque = ? WHERE produto_id = ?',
                [novoEstoque, item.produto_id],
                (err, result) => {
                  if (err) reject(err);
                  else resolve(result);
                }
              );
            });
          }
        }

        // Reduzir estoque se o pedido voltar de "cancelado" para "aguardando" ou "concluído"
        if (statusAtual === 'cancelado' && ['aguardando', 'concluido'].includes(processo_pedido)) {
          const itens = await new Promise((resolve, reject) => {
            db.query(
              'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = ?',
              [id],
              (err, results) => {
                if (err) reject(err);
                else resolve(results);
              }
            );
          });

          for (const item of itens) {
            const [produto] = await Produto.findById(item.produto_id);
            if (!produto) {
              await new Promise((resolve) => {
                db.query('ROLLBACK', () => resolve());
              });
              throw new Error(`Produto ${item.produto_id} não encontrado`);
            }

            if (produto.quantidade_estoque < item.quantidade) {
              await new Promise((resolve) => {
                db.query('ROLLBACK', () => resolve());
              });
              throw new Error(`Estoque insuficiente para o produto ${produto.titulo}`);
            }

            const novoEstoque = produto.quantidade_estoque - item.quantidade;
            await new Promise((resolve, reject) => {
              db.query(
                'UPDATE produtos SET quantidade_estoque = ? WHERE produto_id = ?',
                [novoEstoque, item.produto_id],
                (err, result) => {
                  if (err) reject(err);
                  else resolve(result);
                }
              );
            });
          }
        }

        // Atualizar status do pedido
        await new Promise((resolve, reject) => {
          Pedido.updateStatus(id, processo_pedido, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        // Confirmar transação
        await new Promise((resolve, reject) => {
          db.query('COMMIT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        res.status(200).json({ message: `Status do pedido #${id} atualizado para ${processo_pedido}` });
      } catch (err) {
        // Reverter transação em caso de erro
        await new Promise((resolve) => {
          db.query('ROLLBACK', () => resolve());
        });
        res.status(500).json({ message: 'Erro ao atualizar status do pedido', error: err.message });
      }
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      res.status(500).json({ message: 'Erro ao atualizar status do pedido', error: err.message });
    }
  },
};

module.exports = pedidoController;