"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var express = require('express');

var _require = require('pg'),
    Pool = _require.Pool;

var cors = require('cors');

var bcrypt = require('bcrypt');

var jwt = require('jsonwebtoken');

var app = express();
var JWT_SECRET = 'letov_secret_key_2024';
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
var pool = new Pool({
  host: 'db',
  user: 'postgres',
  password: 'postgres',
  database: 'letov',
  port: 5432
});
pool.connect(function (err, client, release) {
  if (err) {
    console.error('Ошибка подключения к БД:', err.stack);
  } else {
    console.log('✅ Подключено к PostgreSQL');
    release();
  }
}); // Middleware для проверки токена

var authenticateToken = function authenticateToken(req, res, next) {
  var authHeader = req.headers['authorization'];
  var token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Требуется авторизация'
    });
  }

  jwt.verify(token, JWT_SECRET, function (err, user) {
    if (err) {
      return res.status(403).json({
        error: 'Недействительный токен'
      });
    }

    req.user = user;
    next();
  });
};

var isAdmin = function isAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: 'Доступ запрещён'
    });
  }

  next();
}; // ========== АВТОРИЗАЦИЯ ==========


app.post('/api/auth/register', function _callee(req, res) {
  var _req$body, username, email, password, hashedPassword, result, token;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _req$body = req.body, username = _req$body.username, email = _req$body.email, password = _req$body.password;

          if (!(!username || !email || !password)) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: 'Все поля обязательны'
          }));

        case 3:
          _context.prev = 3;
          _context.next = 6;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 6:
          hashedPassword = _context.sent;
          _context.next = 9;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email, is_admin', [username, email, hashedPassword]));

        case 9:
          result = _context.sent;
          token = jwt.sign({
            id: result.rows[0].id,
            username: result.rows[0].username,
            isAdmin: result.rows[0].is_admin
          }, JWT_SECRET, {
            expiresIn: '24h'
          }); // Логируем активность

          _context.next = 13;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO user_activity(user_id, activity) VALUES($1, $2)', [result.rows[0].id, 'Зарегистрировался на сайте']));

        case 13:
          res.json({
            token: token,
            user: {
              id: result.rows[0].id,
              username: result.rows[0].username,
              email: result.rows[0].email,
              isAdmin: result.rows[0].is_admin
            }
          });
          _context.next = 20;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](3);
          console.error('Register error:', _context.t0);

          if (_context.t0.constraint === 'users_username_key') {
            res.status(400).json({
              error: 'Имя пользователя уже занято'
            });
          } else if (_context.t0.constraint === 'users_email_key') {
            res.status(400).json({
              error: 'Email уже используется'
            });
          } else {
            res.status(500).json({
              error: 'Ошибка регистрации'
            });
          }

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 16]]);
});
app.post('/api/auth/login', function _callee2(req, res) {
  var _req$body2, username, password, result, user, validPassword, token;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _req$body2 = req.body, username = _req$body2.username, password = _req$body2.password;

          if (!(!username || !password)) {
            _context2.next = 3;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            error: 'Все поля обязательны'
          }));

        case 3:
          _context2.prev = 3;
          _context2.next = 6;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM users WHERE username = $1', [username]));

        case 6:
          result = _context2.sent;

          if (!(result.rows.length === 0)) {
            _context2.next = 9;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            error: 'Неверное имя пользователя или пароль'
          }));

        case 9:
          user = result.rows[0];
          _context2.next = 12;
          return regeneratorRuntime.awrap(bcrypt.compare(password, user.password_hash));

        case 12:
          validPassword = _context2.sent;

          if (validPassword) {
            _context2.next = 15;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            error: 'Неверное имя пользователя или пароль'
          }));

        case 15:
          _context2.next = 17;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]));

        case 17:
          _context2.next = 19;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO user_activity(user_id, activity) VALUES($1, $2)', [user.id, 'Вход в систему']));

        case 19:
          token = jwt.sign({
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin
          }, JWT_SECRET, {
            expiresIn: '24h'
          });
          res.json({
            token: token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              isAdmin: user.is_admin
            }
          });
          _context2.next = 27;
          break;

        case 23:
          _context2.prev = 23;
          _context2.t0 = _context2["catch"](3);
          console.error('Login error:', _context2.t0);
          res.status(500).json({
            error: 'Ошибка входа'
          });

        case 27:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[3, 23]]);
}); // ========== ОТЗЫВЫ С РЕАКЦИЯМИ ==========

app.get('/api/reviews/:songId', function _callee4(req, res) {
  var songId, result, reviews;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          songId = req.params.songId;
          _context4.prev = 1;
          _context4.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT r.*, u.username \n             FROM reviews r \n             JOIN users u ON r.user_id = u.id \n             WHERE r.song_id = $1 \n             ORDER BY r.created_at DESC", [songId]));

        case 4:
          result = _context4.sent;
          _context4.next = 7;
          return regeneratorRuntime.awrap(Promise.all(result.rows.map(function _callee3(review) {
            var reactionsResult, reactions;
            return regeneratorRuntime.async(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    _context3.next = 2;
                    return regeneratorRuntime.awrap(pool.query('SELECT reaction, COUNT(*) as count FROM review_reactions WHERE review_id = $1 GROUP BY reaction', [review.id]));

                  case 2:
                    reactionsResult = _context3.sent;
                    reactions = {};
                    reactionsResult.rows.forEach(function (r) {
                      reactions[r.reaction] = parseInt(r.count);
                    });
                    return _context3.abrupt("return", _objectSpread({}, review, {
                      reactions: reactions
                    }));

                  case 6:
                  case "end":
                    return _context3.stop();
                }
              }
            });
          })));

        case 7:
          reviews = _context4.sent;
          res.json(reviews);
          _context4.next = 15;
          break;

        case 11:
          _context4.prev = 11;
          _context4.t0 = _context4["catch"](1);
          console.error('GET /reviews error:', _context4.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 15:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[1, 11]]);
});
app.post('/api/reviews', authenticateToken, function _callee5(req, res) {
  var _req$body3, text, songId, result, userResult;

  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _req$body3 = req.body, text = _req$body3.text, songId = _req$body3.songId;

          if (!(!text || text.trim() === '')) {
            _context5.next = 3;
            break;
          }

          return _context5.abrupt("return", res.status(400).json({
            error: 'Text is required'
          }));

        case 3:
          _context5.prev = 3;
          _context5.next = 6;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO reviews(user_id, song_id, text) VALUES($1, $2, $3) RETURNING *', [req.user.id, songId, text.trim()]));

        case 6:
          result = _context5.sent;
          _context5.next = 9;
          return regeneratorRuntime.awrap(pool.query('SELECT username FROM users WHERE id = $1', [req.user.id]));

        case 9:
          userResult = _context5.sent;
          _context5.next = 12;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO user_activity(user_id, activity) VALUES($1, $2)', [req.user.id, "\u041E\u0441\u0442\u0430\u0432\u0438\u043B \u043E\u0442\u0437\u044B\u0432 \u043A \u043F\u0435\u0441\u043D\u0435 ".concat(songId)]));

        case 12:
          res.json(_objectSpread({}, result.rows[0], {
            username: userResult.rows[0].username,
            reactions: {}
          }));
          _context5.next = 19;
          break;

        case 15:
          _context5.prev = 15;
          _context5.t0 = _context5["catch"](3);
          console.error('POST /reviews error:', _context5.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 19:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[3, 15]]);
});
app.post('/api/reviews/:id/react', authenticateToken, function _callee6(req, res) {
  var id, reaction, reactionsResult, reactions;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          id = req.params.id;
          reaction = req.body.reaction;
          _context6.prev = 2;
          _context6.next = 5;
          return regeneratorRuntime.awrap(pool.query("INSERT INTO review_reactions(review_id, user_id, reaction) \n             VALUES($1, $2, $3) \n             ON CONFLICT (review_id, user_id) \n             DO UPDATE SET reaction = $3", [id, req.user.id, reaction]));

        case 5:
          _context6.next = 7;
          return regeneratorRuntime.awrap(pool.query('SELECT reaction, COUNT(*) as count FROM review_reactions WHERE review_id = $1 GROUP BY reaction', [id]));

        case 7:
          reactionsResult = _context6.sent;
          reactions = {};
          reactionsResult.rows.forEach(function (r) {
            reactions[r.reaction] = parseInt(r.count);
          }); // Логируем активность

          _context6.next = 12;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO user_activity(user_id, activity) VALUES($1, $2)', [req.user.id, "\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u043B \u0440\u0435\u0430\u043A\u0446\u0438\u044E ".concat(reaction, " \u043D\u0430 \u043E\u0442\u0437\u044B\u0432 #").concat(id)]));

        case 12:
          res.json({
            reactions: reactions
          });
          _context6.next = 19;
          break;

        case 15:
          _context6.prev = 15;
          _context6.t0 = _context6["catch"](2);
          console.error('POST /reviews/:id/react error:', _context6.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 19:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[2, 15]]);
}); // ========== МЕРЧ ==========

app.get('/api/merch', function _callee7(req, res) {
  var result;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          _context7.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM merch ORDER BY id'));

        case 3:
          result = _context7.sent;
          res.json(result.rows);
          _context7.next = 11;
          break;

        case 7:
          _context7.prev = 7;
          _context7.t0 = _context7["catch"](0);
          console.error('GET /merch error:', _context7.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 11:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.post('/api/merch/order', authenticateToken, function _callee8(req, res) {
  var _req$body4, items, total, result;

  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _req$body4 = req.body, items = _req$body4.items, total = _req$body4.total;
          _context8.prev = 1;
          _context8.next = 4;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO orders(user_id, items, total, status) VALUES($1, $2, $3, $4) RETURNING *', [req.user.id, JSON.stringify(items), total, 'pending']));

        case 4:
          result = _context8.sent;
          _context8.next = 7;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO user_activity(user_id, activity) VALUES($1, $2)', [req.user.id, "\u041E\u0444\u043E\u0440\u043C\u0438\u043B \u0437\u0430\u043A\u0430\u0437 #".concat(result.rows[0].id, " \u043D\u0430 \u0441\u0443\u043C\u043C\u0443 ").concat(total, "\u20BD")]));

        case 7:
          res.json(result.rows[0]);
          _context8.next = 14;
          break;

        case 10:
          _context8.prev = 10;
          _context8.t0 = _context8["catch"](1);
          console.error('POST /merch/order error:', _context8.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 14:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); // ========== АДМИНКА ==========

app.get('/api/admin/stats', authenticateToken, isAdmin, function _callee9(req, res) {
  var usersResult, ordersResult, reviewsResult;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _context9.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT COUNT(*) as total FROM users'));

        case 3:
          usersResult = _context9.sent;
          _context9.next = 6;
          return regeneratorRuntime.awrap(pool.query('SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as revenue FROM orders WHERE status = $1', ['completed']));

        case 6:
          ordersResult = _context9.sent;
          _context9.next = 9;
          return regeneratorRuntime.awrap(pool.query('SELECT COUNT(*) as total FROM reviews'));

        case 9:
          reviewsResult = _context9.sent;
          res.json({
            users: parseInt(usersResult.rows[0].total),
            orders: parseInt(ordersResult.rows[0].total),
            revenue: parseInt(ordersResult.rows[0].revenue || 0),
            reviews: parseInt(reviewsResult.rows[0].total)
          });
          _context9.next = 17;
          break;

        case 13:
          _context9.prev = 13;
          _context9.t0 = _context9["catch"](0);
          console.error('GET /admin/stats error:', _context9.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 17:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 13]]);
});
app.get('/api/admin/users', authenticateToken, isAdmin, function _callee10(req, res) {
  var result;
  return regeneratorRuntime.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          _context10.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT id, username, email, is_admin, created_at, last_login FROM users ORDER BY created_at DESC'));

        case 3:
          result = _context10.sent;
          res.json(result.rows);
          _context10.next = 11;
          break;

        case 7:
          _context10.prev = 7;
          _context10.t0 = _context10["catch"](0);
          console.error('GET /admin/users error:', _context10.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 11:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.get('/api/admin/orders', authenticateToken, isAdmin, function _callee11(req, res) {
  var result;
  return regeneratorRuntime.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          _context11.next = 3;
          return regeneratorRuntime.awrap(pool.query("SELECT o.*, u.username \n             FROM orders o \n             JOIN users u ON o.user_id = u.id \n             ORDER BY o.created_at DESC"));

        case 3:
          result = _context11.sent;
          res.json(result.rows);
          _context11.next = 11;
          break;

        case 7:
          _context11.prev = 7;
          _context11.t0 = _context11["catch"](0);
          console.error('GET /admin/orders error:', _context11.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 11:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.put('/api/admin/orders/:id/status', authenticateToken, isAdmin, function _callee12(req, res) {
  var id, status;
  return regeneratorRuntime.async(function _callee12$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          id = req.params.id;
          status = req.body.status;
          _context12.prev = 2;
          _context12.next = 5;
          return regeneratorRuntime.awrap(pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]));

        case 5:
          _context12.next = 7;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO user_activity(user_id, activity) VALUES($1, $2)', [req.user.id, "\u0418\u0437\u043C\u0435\u043D\u0438\u043B \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u043A\u0430\u0437\u0430 #".concat(id, " \u043D\u0430 ").concat(status)]));

        case 7:
          res.json({
            success: true
          });
          _context12.next = 14;
          break;

        case 10:
          _context12.prev = 10;
          _context12.t0 = _context12["catch"](2);
          console.error('PUT /admin/orders/:id/status error:', _context12.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 14:
        case "end":
          return _context12.stop();
      }
    }
  }, null, null, [[2, 10]]);
});
app.post('/api/admin/users/:id/activity', authenticateToken, isAdmin, function _callee13(req, res) {
  var id, activity;
  return regeneratorRuntime.async(function _callee13$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          id = req.params.id;
          activity = req.body.activity;
          _context13.prev = 2;
          _context13.next = 5;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO user_activity(user_id, activity) VALUES($1, $2)', [id, activity]));

        case 5:
          res.json({
            success: true
          });
          _context13.next = 12;
          break;

        case 8:
          _context13.prev = 8;
          _context13.t0 = _context13["catch"](2);
          console.error('POST /admin/users/:id/activity error:', _context13.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 12:
        case "end":
          return _context13.stop();
      }
    }
  }, null, null, [[2, 8]]);
});
app.get('/api/admin/activity', authenticateToken, isAdmin, function _callee14(req, res) {
  var result;
  return regeneratorRuntime.async(function _callee14$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          _context14.prev = 0;
          _context14.next = 3;
          return regeneratorRuntime.awrap(pool.query("SELECT a.*, u.username \n             FROM user_activity a \n             JOIN users u ON a.user_id = u.id \n             ORDER BY a.created_at DESC \n             LIMIT 100"));

        case 3:
          result = _context14.sent;
          res.json(result.rows);
          _context14.next = 11;
          break;

        case 7:
          _context14.prev = 7;
          _context14.t0 = _context14["catch"](0);
          console.error('GET /admin/activity error:', _context14.t0);
          res.status(500).json({
            error: 'Database error'
          });

        case 11:
        case "end":
          return _context14.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.listen(3000, function () {
  return console.log('✅ API running on port 3000');
});
//# sourceMappingURL=index.dev.js.map
