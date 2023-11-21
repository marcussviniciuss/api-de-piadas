const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 3000


// configuração Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API de Piadas',
    version: '1.0.0',
    description: 'Uma API que fornece diversas piadas.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(bodyParser.json());

const jokes = [
    {
      id: 1,
      question: "Por que o esqueleto não brigou com ninguém?",
      answer: "Porque ele não tem estômago para isso!",
      genre: "engracadas"
    },
  ];
  

const apiKeys = new Set();

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // Limite de solicitações por hora
  message: 'Limite de solicitações excedido. Tente novamente mais tarde.'
});

app.use(limiter);

/**
 * @swagger
 * /jokes/random:
 *   get:
 *     summary: Obtém uma piada aleatória.
 *     responses:
 *       200:
 *         description: Piada aleatória obtida com sucesso.
 *       403:
 *         description: Chave de API inválida ou ausente.
 */
// obter uma piada aletoria
app.get('/jokes/random', (req, res) => {
  const apiKey = req.get('API-Key');
  if (apiKeys.has(apiKey)) {
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    res.json({ joke: randomJoke });
  } else {
    res.status(403).json({ error: 'Chave de API inválida ou ausente' });
  }
});


/**
 * @swagger
 * /jokes/{id}:
 *   get:
 *     summary: Obtém uma piada específica pelo ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da piada a ser obtida.
 *     responses:
 *       200:
 *         description: Piada obtida com sucesso.
 *       403:
 *         description: Chave de API inválida ou ausente.
 *       404:
 *         description: Piada não encontrada.
 */
// obter uma piada por ID
app.get('/jokes/:id', (req, res) => {
    const apiKey = req.get('API-Key');
    if (apiKeys.has(apiKey)) {
      const jokeId = parseInt(req.params.id);
      const joke = jokes.find(j => j.id === jokeId);
      if (joke) {
        res.json(joke);
      } else {
        res.status(404).json({ error: 'Piada não encontrada' });
      }
    } else {
      res.status(403).json({ error: 'Chave de API inválida ou ausente' });
    }
  });


/**
 * @swagger
 * /jokes/add:
 *   post:
 *     summary: Adiciona uma nova piada.
 *     parameters:
 *       - in: header
 *         name: API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Sua chave de API válida.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               genre:
 *                 type: string
 *             example:
 *               question: "Sua nova piada engraçada aqui!"
 *               answer: "A resposta engraçada"
 *               genre: "engracadas"
 *     responses:
 *       201:
 *         description: Piada adicionada com sucesso.
 *       400:
 *         description: A piada deve ter uma pergunta, uma resposta e um gênero.
 *       403:
 *         description: Chave de API inválida ou ausente.
 */
// adicione uma nova piada
app.post('/jokes/add', (req, res) => {
    const apiKey = req.get('API-Key');
    if (apiKeys.has(apiKey)) {
      const { question, answer, genre } = req.body; // Obtenha a pergunta, resposta e gênero do corpo da solicitação.
      if (question && answer && genre) {
        const newId = jokes.length + 1;
        const newJoke = { id: newId, question, answer, genre };
        jokes.push(newJoke);
        res.status(201).json({ message: 'Piada adicionada com sucesso' });
      } else {
        res.status(400).json({ error: 'A piada deve ter uma pergunta, uma resposta e um gênero' });
      }
    } else {
      res.status(403).json({ error: 'Chave de API inválida ou ausente' });
    }
});


/**
 * @swagger
 * /jokes:
 *   get:
 *     summary: Obtém todas as piadas.
 *     parameters:
 *       - in: header
 *         name: API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Sua chave de API válida.
 *     responses:
 *       200:
 *         description: Todas as piadas obtidas com sucesso.
 *       403:
 *         description: Chave de API inválida ou ausente.
 */
// obter todas as piadas
app.get('/jokes', (req, res) => {
    const apiKey = req.get('API-Key');
    if (apiKeys.has(apiKey)) {
      res.json(jokes);
    } else {
      res.status(403).json({ error: 'Chave de API inválida ou ausente' });
    }
});


  /**
 * @swagger
 * /jokes/genre/{genre}:
 *   get:
 *     summary: Obtém todas as piadas de um gênero específico.
 *     parameters:
 *       - in: header
 *         name: API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Sua chave de API válida.
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *         description: Gênero das piadas a serem obtidas.
 *     responses:
 *       200:
 *         description: Piadas do gênero obtidas com sucesso.
 *       403:
 *         description: Chave de API inválida ou ausente.
 *       404:
 *         description: Nenhuma piada encontrada para este gênero.
 */
// ver piadas pelo genero 
app.get('/jokes/genre/:genre', (req, res) => {
    const apiKey = req.get('API-Key');
    const genre = req.params.genre;
  
    if (apiKeys.has(apiKey)) {
      const jokesByGenre = jokes.filter(joke => joke.genre === genre);
  
      if (jokesByGenre.length > 0) {
        res.json(jokesByGenre);
      } else {
        res.status(404).json({ error: 'Nenhuma piada encontrada para este gênero' });
      }
    } else {
      res.status(403).json({ error: 'Chave de API inválida ou ausente' });
    }
});


/**
 * @swagger
 * /jokes/delete/{id}:
 *   delete:
 *     summary: Deleta uma piada pelo ID.
 *     parameters:
 *       - in: header
 *         name: API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Sua chave de API válida.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da piada a ser excluída.
 *     responses:
 *       200:
 *         description: Piada excluída com sucesso.
 *       403:
 *         description: Chave de API inválida ou ausente.
 *       404:
 *         description: Piada não encontrada.
 */  
// deletar uma piada
app.delete('/jokes/delete/:id', (req, res) => {
    const apiKey = req.get('API-Key');
    if (apiKeys.has(apiKey)) {
      const jokeId = parseInt(req.params.id);
  
      // Encontre o índice da piada com base no ID
      const jokeIndex = jokes.findIndex(j => j.id === jokeId);
  
      if (jokeIndex !== -1) {
        // Se o índice for diferente de -1, a piada existe e pode ser excluída
        jokes.splice(jokeIndex, 1); // Remove a piada do array
        res.status(200).json({ message: 'Piada excluída com sucesso' });
      } else {
        res.status(404).json({ error: 'Piada não encontrada' });
      }
    } else {
      res.status(403).json({ error: 'Chave de API inválida ou ausente' });
    }
});


/**
 * @swagger
 * /jokes/edit/{id}:
 *   put:
 *     summary: Edita uma piada pelo ID.
 *     parameters:
 *       - in: header
 *         name: API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Sua chave de API válida.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da piada a ser editada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               genre:
 *                 type: string
 *             example:
 *               question: "Nova pergunta da piada"
 *               answer: "Nova resposta da piada"
 *               genre: "engracadas"
 *           description: Dados da piada a ser editada.
 *     responses:
 *       200:
 *         description: Piada editada com sucesso.
 *       400:
 *         description: Nada para editar. Forneça pelo menos question, answer ou genre.
 *       403:
 *         description: Chave de API inválida ou ausente.
 *       404:
 *         description: Piada não encontrada.
 */
// editar uma piada
app.put('/jokes/edit/:id', (req, res) => {
    const apiKey = req.get('API-Key');
    if (apiKeys.has(apiKey)) {
      const jokeId = parseInt(req.params.id);
  
      // Encontre o índice da piada com base no ID
      const jokeIndex = jokes.findIndex(j => j.id === jokeId);
  
      if (jokeIndex !== -1) {
        // Se o índice for diferente de -1, a piada existe e pode ser editada
        const { question, answer, genre } = req.body;
  
        if (question || answer || genre) {
          if (question) {
            jokes[jokeIndex].question = question;
          }
          if (answer) {
            jokes[jokeIndex].answer = answer;
          }
          if (genre) {
            jokes[jokeIndex].genre = genre;
          }
  
          res.status(200).json({ message: 'Piada editada com sucesso' });
        } else {
          res.status(400).json({ error: 'Nada para editar. Forneça pelo menos question, answer ou genre.' });
        }
      } else {
        res.status(404).json({ error: 'Piada não encontrada' });
      }
    } else {
      res.status(403).json({ error: 'Chave de API inválida ou ausente' });
    }
});
  

/**
 * @swagger
 * /apikeys:
 *   post:
 *     summary: Gera uma nova chave de API.
 *     responses:
 *       200:
 *         description: Chave de API gerada com sucesso.
 */
// gerar a apikey
app.post('/apikeys', (req, res) => {
  const apiKey = crypto.randomBytes(16).toString('hex');
  apiKeys.add(apiKey);
  res.json({ apiKey });
});

//  middleware de análise de corpo
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// arrays para armazenar usuários registrados e suas API keys
const users = [];


/**
 * @swagger
 * /register:
 *   get:
 *     summary: Página de registro de usuários.
 *     description: Retorna a página de registro de usuários.
 *     responses:
 *       200:
 *         description: Página de registro carregada com sucesso.
 */
// rota para a página de registro (GET)
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});


/**
 * @swagger
 * /register:
 *   post:
 *     summary: Processar o registro de um novo usuário.
 *     description: Registra um novo usuário e gera uma API key.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               username: "novousuario"
 *               password: "senhadonovousuario"
 *     responses:
 *       302:
 *         description: Redirecionado com sucesso para a página de obtenção da API key.
 *       400:
 *         description: Nome de usuário ou senha em branco.
 */
// rota para processar o registro (POST)
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    // Se o nome de usuário ou a senha estiverem em branco, exiba uma mensagem de erro
    return res.status(400).json({ error: 'O nome de usuário e a senha são obrigatórios.' });
  }

  // Simule o armazenamento seguro da senha (não recomendado para uso real)
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  // Armazene o usuário (normalmente em um banco de dados)
  users.push({ username, password: hashedPassword });

  // Gere uma API key (gerar uma chave segura é importante)
  const apiKey = crypto.randomBytes(16).toString('hex');

  // Armazene a API key
  apiKeys.add(apiKey);

  // Redirecione para a página de obtenção da API key com a API key gerada
  res.redirect(`/get-api-key?apiKey=${apiKey}`);
});


/**
 * @swagger
 * /apikeys:
 *   post:
 *     summary: Gera uma nova chave de API pela url.
 *     responses:
 *       200:
 *         description: Chave de API gerada com sucesso.
 */
// Rota para a página de obtenção da API key (GET)
app.get('/get-api-key', (req, res) => {
  const apiKey = req.query.apiKey;

  res.sendFile(__dirname + '/get-api-key.html', { apiKey });
});


app.listen(port, () => {
  console.log(`API de Piadas rodando em http://localhost:${port}`);
});