window.onload = () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // 球的屬性
    let balls = []; // 將單一球的屬性改為多球
    const ballRadius = 10;

    // 板子的屬性
    const paddleHeight = 10;
    let paddleWidth = 75; // 改為變數，方便調整
    let paddleX;

    // 磚塊的屬性
    const brickRowCount = 3;
    const brickColumnCount = 5;
    const brickWidth = 75;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;

    let bricks = [];
    let score = 0;
    let lives = 3; // 設定初始生命數量
    let gameRunning = false; // 控制遊戲是否運行的變數

    // 獲取分數和生命顯示元素
    const scoreDisplay = document.getElementById("score");
    const livesDisplay = document.getElementById("lives"); // 新增生命顯示
    const restartBtn = document.getElementById("restart-btn");

    // 設定難度的參數
    let difficulty = "medium"; // 預設為中等
    let specialBrickChance = 0.3; // 特殊磚塊的機率
    let ballSpeedMultiplier = 1; // 球的速度乘數

    // 升級道具相關
    let powerUps = [];
    const powerUpWidth = 20;
    const powerUpHeight = 20;
    const powerUpTypes = ["expand", "shrink", "speed", "slow", "multi"]; // 新增多球道具

    // 根據選擇的難度設置參數
    function setDifficulty() {
        const difficultySelect = document.getElementById("difficulty");
        difficulty = difficultySelect.value;

        switch (difficulty) {
            case "easy":
                specialBrickChance = 0.2; // 簡單模式，特殊磚塊機率較低
                ballSpeedMultiplier = 0.8; // 簡單模式，球速較慢
                break;
            case "medium":
                specialBrickChance = 0.3; // 中等模式
                ballSpeedMultiplier = 1; // 中等模式，球速正常
                break;
            case "hard":
                specialBrickChance = 0.5; // 困難模式，特殊磚塊機率較高
                ballSpeedMultiplier = 1.2; // 困難模式，球速較快
                break;
        }
    }

    // 初始化遊戲
    function init() {
        setDifficulty(); // 設置難度
        balls = [{
            x: canvas.width / 2,
            y: canvas.height - 30,
            dx: 2 * ballSpeedMultiplier, // 球的初始速度
            dy: -2 * ballSpeedMultiplier
        }];
        paddleX = (canvas.width - paddleWidth) / 2;
        score = 0;
        lives = 3; // 重置生命數量
        scoreDisplay.innerText = "Score: " + score;
        livesDisplay.innerText = "Lives: " + lives; // 更新生命顯示
        rightPressed = false;
        leftPressed = false;

        bricks = [];
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                // 隨機決定磚塊是普通磚塊還是特殊磚塊
                const isSpecial = Math.random() < specialBrickChance; // 根據難度設定機率
                bricks[c][r] = {
                    x: 0,
                    y: 0,
                    status: 1,
                    hits: isSpecial ? 3 : 1 // 特殊磚塊需要三次擊打
                };
            }
        }
        gameRunning = true; // 開始遊戲
        powerUps = []; // 清空道具
        createPowerUp(); // 創建道具
    }

    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    function keyDownHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
        else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    }

    function keyUpHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
        else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
    }

    function drawBall(ball) { // 修改為接受球物件
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }

    function drawBricks() {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                const brick = bricks[c][r];
                if (brick.status === 1) {
                    const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                    const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                    brick.x = brickX;
                    brick.y = brickY;

                    ctx.beginPath();
                    ctx.rect(brickX, brickY, brickWidth, brickHeight);

                    // 根據磚塊的擊打次數顯示不同顏色
                    if (brick.hits === 3) {
                        ctx.fillStyle = "#FF5733"; // 特殊磚塊的顏色
                    } else {
                        ctx.fillStyle = "#0095DD"; // 普通磚塊的顏色
                    }

                    ctx.fill();
                    ctx.closePath();

                    // 顯示擊打次數
                    ctx.fillStyle = "#FFFFFF"; // 字體顏色
                    ctx.font = "12px Arial";
                    ctx.fillText(brick.hits, brickX + brickWidth / 2 - 10, brickY + brickHeight / 2 + 5);
                }
            }
        }
    }

    function drawPowerUps() {
        powerUps.forEach(powerUp => {
            ctx.beginPath();
            ctx.rect(powerUp.x, powerUp.y, powerUpWidth, powerUpHeight);
            ctx.fillStyle = powerUp.type === "expand" ? "green" :
                powerUp.type === "shrink" ? "red" :
                powerUp.type === "speed" ? "blue" :
                powerUp.type === "slow" ? "orange" : "purple"; // 不同道具顏色
            ctx.fill();
            ctx.closePath();
        });
    }

    function collisionDetection() {
        // 磚塊碰撞檢測
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                const brick = bricks[c][r];
                if (brick.status === 1) {
                    balls.forEach(ball => {
                        if (
                            ball.x > brick.x &&
                            ball.x < brick.x + brickWidth &&
                            ball.y > brick.y &&
                            ball.y < brick.y + brickHeight
                        ) {
                            ball.dy = -ball.dy;
                            brick.hits--; // 減少磚塊的擊打次數
                            if (brick.hits === 0) {
                                brick.status = 0; // 磚塊被擊破
                                score++;
                                if (Math.random() < 0.5) { // 50% 機率掉落道具
                                    createPowerUp(brick.x + brickWidth / 2, brick.y);
                                }
                            }
                        }
                    });
                }
            }
        }

        // 檢查道具和板子的碰撞
        powerUps.forEach((powerUp, index) => {
            if (powerUp.active) {
                if (powerUp.y + powerUpHeight > canvas.height - paddleHeight && 
                    powerUp.x > paddleX && powerUp.x < paddleX + paddleWidth) {
                    applyPowerUp(powerUp.type);
                    powerUps.splice(index, 1); // 獲取道具後刪除
                } else {
                    powerUp.y += 2; // 道具下落
                    if (powerUp.y > canvas.height) {
                        powerUps.splice(index, 1); // 超出畫面時刪除
                    }
                }
            }
        });
    }

    function createPowerUp(x, y) {
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        powerUps.push({ x: x || Math.random() * (canvas.width - powerUpWidth), y: y || 0, type: type, active: true });
    }

    function applyPowerUp(type) {
        switch (type) {
            case "expand":
                paddleWidth = Math.min(paddleWidth + 50, canvas.width); // 擴大板子
                setTimeout(() => {
                    paddleWidth = Math.max(paddleWidth - 50, 75); // 恢復原來大小
                }, 5000);
                break;
            case "shrink":
                paddleWidth = Math.max(paddleWidth - 50, 30); // 縮小板子
                setTimeout(() => {
                    paddleWidth = Math.min(paddleWidth + 50, canvas.width); // 恢復原來大小
                }, 5000);
                break;
            case "speed":
                balls.forEach(ball => {
                    ball.dx *= 1.5; // 加速球
                    ball.dy *= 1.5;
                });
                setTimeout(() => {
                    balls.forEach(ball => {
                        ball.dx /= 1.5; // 恢復原來速度
                        ball.dy /= 1.5;
                    });
                }, 10000);
                break;
            case "slow":
                balls.forEach(ball => {
                    ball.dx *= 0.5; // 減速球
                    ball.dy *= 0.5;
                });
                setTimeout(() => {
                    balls.forEach(ball => {
                        ball.dx /= 0.5; // 恢復原來速度
                        ball.dy /= 0.5;
                    });
                }, 10000);
                break;
            case "multi":
                if (balls.length < 5) { // 最多允許 5 顆球
                    balls.push({
                        x: paddleX + paddleWidth / 2,
                        y: canvas.height - 30,
                        dx: balls[0].dx,
                        dy: -balls[0].dy // 新增的球與第一顆球擁有相同的速度
                    });
                }
                break;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        balls.forEach(ball => drawBall(ball)); // 修改為遍歷多顆球
        drawPaddle();
        drawPowerUps();
        collisionDetection();

        balls.forEach(ball => {
            if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
                ball.dx = -ball.dx;
            }
            if (ball.y + ball.dy < ballRadius) {
                ball.dy = -ball.dy;
            } else if (ball.y + ball.dy > canvas.height - ballRadius) {
                if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
                    ball.dy = -ball.dy;
                } else {
                    lives--; // 失去一條生命
                    livesDisplay.innerText = "Lives: " + lives; // 更新生命顯示
                    if (lives === 0) {
                        endGame(); // 結束遊戲
                    } else {
                        // 重置球的位置
                        ball.x = canvas.width / 2;
                        ball.y = canvas.height - 30;
                        ball.dx = 2 * ballSpeedMultiplier; // 重設速度
                        ball.dy = -2 * ballSpeedMultiplier;
                    }
                }
            }
            ball.x += ball.dx;
            ball.y += ball.dy;
        });

        if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
        else if (leftPressed && paddleX > 0) paddleX -= 7;

        if (gameRunning) {
            requestAnimationFrame(draw);
        }
    }

    function endGame() {
        gameRunning = false; // 停止遊戲
        alert("Game Over! Your score was: " + score);
        restartBtn.style.display = "block"; // 顯示重啟按鈕
    }

    document.getElementById("start-btn").addEventListener("click", () => {
        init(); // 初始化遊戲
        draw();
        restartBtn.style.display = "none"; // 隱藏重啟按鈕
    });

    // 重啟遊戲按鈕事件
    restartBtn.addEventListener("click", () => {
        init(); // 重新初始化遊戲
        draw();
        restartBtn.style.display = "none"; // 隱藏重啟按鈕
    });
};
