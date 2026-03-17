(function () {
  function getLayoutCode(thumb) {
    const src = thumb.getAttribute("src") || "";
    const fileName = src.split("/").pop() || "";
    return fileName
      .split("?")[0]
      .replace(/\.[^.]+$/, "")
      .toLowerCase();
  }

  function parseLayoutSpec(type, code) {
    const values = (code.match(/\d+/g) || []).map(Number);

    if (type === "equal") {
      const total = Math.max(1, values[0] || 1);
      return { mode: "equal", total };
    }

    let total = values.length
      ? values.reduce(function (sum, value) {
          return sum + value;
        }, 0)
      : 1;
    let main = 1;

    if (/^\d+on\d+$/i.test(code)) {
      main = Math.max(1, values[values.length - 1] || 1);
    } else if (/^\d+[vdp]/i.test(code)) {
      main = Math.max(1, values[0] || 1);
    }

    total = Math.max(total, main);
    return { mode: "focus", total: Math.min(total, 25), main };
  }

  function createZoomTile(index, isMain) {
    const tile = document.createElement("div");
    tile.className = "zoom-tile" + (isMain ? " main" : "");

    const label = document.createElement("span");
    label.className = "zoom-label is-mini";
    label.textContent = "Site " + String(101 + index);

    tile.appendChild(label);
    return tile;
  }

  function createMicroHost(startIndex) {
    const host = document.createElement("div");
    host.className = "zoom-micro-host";

    for (let i = 0; i < 4; i += 1) {
      const cell = document.createElement("div");
      cell.className = "zoom-micro-cell";

      const label = document.createElement("span");
      label.className = "zoom-micro-label";
      label.textContent = "Site " + String(101 + startIndex + i);

      cell.appendChild(label);
      host.appendChild(cell);
    }

    return host;
  }

  function renderEqualLayout(grid, total, code) {
    grid.classList.remove("focus-mode");
    grid.classList.toggle("single", total === 1);

    if (total === 3 && /alter/.test(code)) {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(2, 1fr)";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "2 / span 2";
      mainTile.style.gridRow = "1";
      grid.appendChild(mainTile);

      const bottomLeft = createZoomTile(1, false);
      bottomLeft.style.gridColumn = "1 / span 2";
      bottomLeft.style.gridRow = "2";
      grid.appendChild(bottomLeft);

      const bottomRight = createZoomTile(2, false);
      bottomRight.style.gridColumn = "3 / span 2";
      bottomRight.style.gridRow = "2";
      grid.appendChild(bottomRight);
      return;
    }

    if (total === 3) {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(2, 1fr)";

      const topLeft = createZoomTile(0, true);
      topLeft.style.gridColumn = "1 / span 2";
      topLeft.style.gridRow = "1";
      grid.appendChild(topLeft);

      const topRight = createZoomTile(1, false);
      topRight.style.gridColumn = "3 / span 2";
      topRight.style.gridRow = "1";
      grid.appendChild(topRight);

      const bottomCenter = createZoomTile(2, false);
      bottomCenter.style.gridColumn = "2 / span 2";
      bottomCenter.style.gridRow = "2";
      grid.appendChild(bottomCenter);
      return;
    }

    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    grid.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    grid.style.gridTemplateRows = "repeat(" + rows + ", 1fr)";

    for (let i = 0; i < total; i += 1) {
      grid.appendChild(createZoomTile(i, i === 0));
    }
  }

  function renderFocusLayout(grid, total, code) {
    grid.classList.remove("single");
    grid.classList.add("focus-mode");

    if (code === "1v4") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(4, 1fr)";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "1 / span 2";
      mainTile.style.gridRow = "2 / span 2";
      grid.appendChild(mainTile);

      const top1 = createZoomTile(9, false);
      top1.style.gridColumn = "1";
      top1.style.gridRow = "1";
      grid.appendChild(top1);

      const top2 = createZoomTile(10, false);
      top2.style.gridColumn = "2";
      top2.style.gridRow = "1";
      grid.appendChild(top2);

      const top3 = createZoomTile(11, false);
      top3.style.gridColumn = "3";
      top3.style.gridRow = "1";
      grid.appendChild(top3);

      const top4 = createZoomTile(12, false);
      top4.style.gridColumn = "4";
      top4.style.gridRow = "1";
      grid.appendChild(top4);

      const rightTopLeft = createZoomTile(7, false);
      rightTopLeft.style.gridColumn = "3";
      rightTopLeft.style.gridRow = "2";
      grid.appendChild(rightTopLeft);

      const rightTopRight = createZoomTile(8, false);
      rightTopRight.style.gridColumn = "4";
      rightTopRight.style.gridRow = "2";
      grid.appendChild(rightTopRight);

      const rightBottomLeft = createZoomTile(5, false);
      rightBottomLeft.style.gridColumn = "3";
      rightBottomLeft.style.gridRow = "3";
      grid.appendChild(rightBottomLeft);

      const rightBottomRight = createZoomTile(6, false);
      rightBottomRight.style.gridColumn = "4";
      rightBottomRight.style.gridRow = "3";
      grid.appendChild(rightBottomRight);

      const bottom1 = createZoomTile(1, false);
      bottom1.style.gridColumn = "1";
      bottom1.style.gridRow = "4";
      grid.appendChild(bottom1);

      const bottom2 = createZoomTile(2, false);
      bottom2.style.gridColumn = "2";
      bottom2.style.gridRow = "4";
      grid.appendChild(bottom2);

      const bottom3 = createZoomTile(3, false);
      bottom3.style.gridColumn = "3";
      bottom3.style.gridRow = "4";
      grid.appendChild(bottom3);

      const bottom4 = createZoomTile(4, false);
      bottom4.style.gridColumn = "4";
      bottom4.style.gridRow = "4";
      grid.appendChild(bottom4);
      return;
    }

    if (code === "1v5") {
      grid.style.gridTemplateColumns = "repeat(3, 1fr)";
      grid.style.gridTemplateRows = "repeat(3, 1fr)";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "1 / span 2";
      mainTile.style.gridRow = "1 / span 2";
      grid.appendChild(mainTile);

      const rightTop = createZoomTile(5, false);
      rightTop.style.gridColumn = "3";
      rightTop.style.gridRow = "1";
      grid.appendChild(rightTop);

      const rightMid = createZoomTile(4, false);
      rightMid.style.gridColumn = "3";
      rightMid.style.gridRow = "2";
      grid.appendChild(rightMid);

      const bottomLeft = createZoomTile(1, false);
      bottomLeft.style.gridColumn = "1";
      bottomLeft.style.gridRow = "3";
      grid.appendChild(bottomLeft);

      const bottomMid = createZoomTile(2, false);
      bottomMid.style.gridColumn = "2";
      bottomMid.style.gridRow = "3";
      grid.appendChild(bottomMid);

      const bottomRight = createZoomTile(3, false);
      bottomRight.style.gridColumn = "3";
      bottomRight.style.gridRow = "3";
      grid.appendChild(bottomRight);
      return;
    }

    if (code === "1v9") {
      grid.style.gridTemplateColumns = "repeat(5, 1fr)";
      grid.style.gridTemplateRows = "repeat(5, 1fr)";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "1 / span 4";
      mainTile.style.gridRow = "1 / span 4";
      grid.appendChild(mainTile);

      const rightTop = createZoomTile(9, false);
      rightTop.style.gridColumn = "5";
      rightTop.style.gridRow = "1";
      grid.appendChild(rightTop);

      const rightUpperMid = createZoomTile(8, false);
      rightUpperMid.style.gridColumn = "5";
      rightUpperMid.style.gridRow = "2";
      grid.appendChild(rightUpperMid);

      const rightLowerMid = createZoomTile(7, false);
      rightLowerMid.style.gridColumn = "5";
      rightLowerMid.style.gridRow = "3";
      grid.appendChild(rightLowerMid);

      const rightBottom = createZoomTile(6, false);
      rightBottom.style.gridColumn = "5";
      rightBottom.style.gridRow = "4";
      grid.appendChild(rightBottom);

      const bottom1 = createZoomTile(1, false);
      bottom1.style.gridColumn = "1";
      bottom1.style.gridRow = "5";
      grid.appendChild(bottom1);

      const bottom2 = createZoomTile(2, false);
      bottom2.style.gridColumn = "2";
      bottom2.style.gridRow = "5";
      grid.appendChild(bottom2);

      const bottom3 = createZoomTile(3, false);
      bottom3.style.gridColumn = "3";
      bottom3.style.gridRow = "5";
      grid.appendChild(bottom3);

      const bottom4 = createZoomTile(4, false);
      bottom4.style.gridColumn = "4";
      bottom4.style.gridRow = "5";
      grid.appendChild(bottom4);

      const bottom5 = createZoomTile(5, false);
      bottom5.style.gridColumn = "5";
      bottom5.style.gridRow = "5";
      grid.appendChild(bottom5);
      return;
    }

    if (code === "1v11") {
      grid.style.gridTemplateColumns = "repeat(6, 1fr)";
      grid.style.gridTemplateRows = "repeat(6, 1fr)";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "1 / span 5";
      mainTile.style.gridRow = "1 / span 5";
      grid.appendChild(mainTile);

      const right1 = createZoomTile(11, false);
      right1.style.gridColumn = "6";
      right1.style.gridRow = "1";
      grid.appendChild(right1);

      const right2 = createZoomTile(10, false);
      right2.style.gridColumn = "6";
      right2.style.gridRow = "2";
      grid.appendChild(right2);

      const right3 = createZoomTile(9, false);
      right3.style.gridColumn = "6";
      right3.style.gridRow = "3";
      grid.appendChild(right3);

      const right4 = createZoomTile(8, false);
      right4.style.gridColumn = "6";
      right4.style.gridRow = "4";
      grid.appendChild(right4);

      const right5 = createZoomTile(7, false);
      right5.style.gridColumn = "6";
      right5.style.gridRow = "5";
      grid.appendChild(right5);

      for (let i = 1; i <= 6; i += 1) {
        const bottomTile = createZoomTile(i, false);
        bottomTile.style.gridColumn = String(i);
        bottomTile.style.gridRow = "6";
        grid.appendChild(bottomTile);
      }
      return;
    }

    if (code === "1v12") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(4, 1fr)";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "1 / span 2";
      mainTile.style.gridRow = "1 / span 2";
      grid.appendChild(mainTile);

      const rightTopLeft = createZoomTile(1, false);
      rightTopLeft.style.gridColumn = "3";
      rightTopLeft.style.gridRow = "1";
      grid.appendChild(rightTopLeft);

      const rightTopRight = createZoomTile(2, false);
      rightTopRight.style.gridColumn = "4";
      rightTopRight.style.gridRow = "1";
      grid.appendChild(rightTopRight);

      const rightBottomLeft = createZoomTile(3, false);
      rightBottomLeft.style.gridColumn = "3";
      rightBottomLeft.style.gridRow = "2";
      grid.appendChild(rightBottomLeft);

      const rightBottomRight = createZoomTile(4, false);
      rightBottomRight.style.gridColumn = "4";
      rightBottomRight.style.gridRow = "2";
      grid.appendChild(rightBottomRight);

      for (let i = 5; i <= 12; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(((i - 5) % 4) + 1);
        tile.style.gridRow = String(Math.floor((i - 5) / 4) + 3);
        grid.appendChild(tile);
      }
      return;
    }

    if (code === "1v16") {
      grid.style.gridTemplateColumns = "repeat(5, 1fr)";
      grid.style.gridTemplateRows = "repeat(5, 1fr)";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "1 / span 3";
      mainTile.style.gridRow = "1 / span 3";
      grid.appendChild(mainTile);

      for (let i = 1; i <= 6; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(((i - 1) % 2) + 4);
        tile.style.gridRow = String(Math.floor((i - 1) / 2) + 1);
        grid.appendChild(tile);
      }

      for (let i = 7; i <= 16; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(((i - 7) % 5) + 1);
        tile.style.gridRow = String(Math.floor((i - 7) / 5) + 4);
        grid.appendChild(tile);
      }
      return;
    }

    if (code === "1v20") {
      grid.style.gridTemplateColumns = "repeat(6, 1fr)";
      grid.style.gridTemplateRows = "repeat(6, 1fr)";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "1 / span 4";
      mainTile.style.gridRow = "1 / span 4";
      grid.appendChild(mainTile);

      for (let i = 1; i <= 8; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(((i - 1) % 2) + 5);
        tile.style.gridRow = String(Math.floor((i - 1) / 2) + 1);
        grid.appendChild(tile);
      }

      for (let i = 9; i <= 20; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(((i - 9) % 6) + 1);
        tile.style.gridRow = String(Math.floor((i - 9) / 6) + 5);
        grid.appendChild(tile);
      }
      return;
    }

    if (code === "2v4") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "2fr 1fr";

      const mainLeft = createZoomTile(0, true);
      mainLeft.style.gridColumn = "1 / span 2";
      mainLeft.style.gridRow = "1";
      grid.appendChild(mainLeft);

      const mainRight = createZoomTile(1, true);
      mainRight.style.gridColumn = "3 / span 2";
      mainRight.style.gridRow = "1";
      grid.appendChild(mainRight);

      for (let i = 2; i <= 5; i += 1) {
        const bottomTile = createZoomTile(i, false);
        bottomTile.style.gridColumn = String(i - 1);
        bottomTile.style.gridRow = "2";
        grid.appendChild(bottomTile);
      }
      return;
    }

    if (code === "2v18") {
      grid.style.gridTemplateColumns = "repeat(6, 1fr)";
      grid.style.gridTemplateRows = "2fr 1fr 1fr 1fr";

      const mainLeft = createZoomTile(0, true);
      mainLeft.style.gridColumn = "1 / span 3";
      mainLeft.style.gridRow = "1";
      grid.appendChild(mainLeft);

      const mainRight = createZoomTile(1, true);
      mainRight.style.gridColumn = "4 / span 3";
      mainRight.style.gridRow = "1";
      grid.appendChild(mainRight);

      for (let i = 2; i <= 19; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(((i - 2) % 6) + 1);
        tile.style.gridRow = String(Math.floor((i - 2) / 6) + 2);
        grid.appendChild(tile);
      }
      return;
    }

    if (code === "3v4") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "1.15fr 1fr 1fr";

      const topLeft = createZoomTile(0, true);
      topLeft.style.gridColumn = "1 / span 2";
      topLeft.style.gridRow = "1";
      grid.appendChild(topLeft);

      const topRight = createZoomTile(1, true);
      topRight.style.gridColumn = "3 / span 2";
      topRight.style.gridRow = "1";
      grid.appendChild(topRight);

      const bottomLeft = createZoomTile(2, true);
      bottomLeft.style.gridColumn = "1 / span 2";
      bottomLeft.style.gridRow = "2 / span 2";
      grid.appendChild(bottomLeft);

      const rightTopLeft = createZoomTile(3, false);
      rightTopLeft.style.gridColumn = "3";
      rightTopLeft.style.gridRow = "2";
      grid.appendChild(rightTopLeft);

      const rightTopRight = createZoomTile(4, false);
      rightTopRight.style.gridColumn = "4";
      rightTopRight.style.gridRow = "2";
      grid.appendChild(rightTopRight);

      const rightBottomLeft = createZoomTile(5, false);
      rightBottomLeft.style.gridColumn = "3";
      rightBottomLeft.style.gridRow = "3";
      grid.appendChild(rightBottomLeft);

      const rightBottomRight = createZoomTile(6, false);
      rightBottomRight.style.gridColumn = "4";
      rightBottomRight.style.gridRow = "3";
      grid.appendChild(rightBottomRight);
      return;
    }

    if (code === "4v1") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(4, 1fr)";

      const topOrder = [9, 10, 11, 12];
      topOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "1";
        grid.appendChild(tile);
      });

      const row2Left = [7, 8];
      row2Left.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "2";
        grid.appendChild(tile);
      });

      const row3Left = [5, 6];
      row3Left.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "3";
        grid.appendChild(tile);
      });

      const bottomOrder = [1, 2, 3, 4];
      bottomOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "4";
        grid.appendChild(tile);
      });

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "3 / span 2";
      mainTile.style.gridRow = "2 / span 2";
      grid.appendChild(mainTile);
      return;
    }

    if (code === "8v2") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(4, 1fr)";

      const mainTop = createZoomTile(0, true);
      mainTop.style.gridColumn = "2 / span 2";
      mainTop.style.gridRow = "1 / span 2";
      grid.appendChild(mainTop);

      const mainBottom = createZoomTile(1, true);
      mainBottom.style.gridColumn = "2 / span 2";
      mainBottom.style.gridRow = "3 / span 2";
      grid.appendChild(mainBottom);

      const leftCol = [2, 3, 4, 5];
      leftCol.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = "1";
        tile.style.gridRow = String(idx + 1);
        grid.appendChild(tile);
      });

      const rightCol = [6, 7, 8, 9];
      rightCol.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = "4";
        tile.style.gridRow = String(idx + 1);
        grid.appendChild(tile);
      });
      return;
    }

    if (code === "9on1") {
      grid.style.gridTemplateColumns = "repeat(9, 1fr)";
      grid.style.gridTemplateRows = "4fr 1fr";

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "1 / span 9";
      mainTile.style.gridRow = "1";
      grid.appendChild(mainTile);

      const bottomOrder = [8, 6, 4, 2, 1, 3, 5, 7, 9];
      bottomOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "2";
        grid.appendChild(tile);
      });
      return;
    }

    if (code === "10on1") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(4, 1fr)";

      const topLeft = createZoomTile(9, false);
      topLeft.style.gridColumn = "1";
      topLeft.style.gridRow = "1";
      grid.appendChild(topLeft);

      const topRight = createZoomTile(10, false);
      topRight.style.gridColumn = "4";
      topRight.style.gridRow = "1";
      grid.appendChild(topRight);

      const leftMidTop = createZoomTile(7, false);
      leftMidTop.style.gridColumn = "1";
      leftMidTop.style.gridRow = "2";
      grid.appendChild(leftMidTop);

      const rightMidTop = createZoomTile(8, false);
      rightMidTop.style.gridColumn = "4";
      rightMidTop.style.gridRow = "2";
      grid.appendChild(rightMidTop);

      const leftMidBottom = createZoomTile(5, false);
      leftMidBottom.style.gridColumn = "1";
      leftMidBottom.style.gridRow = "3";
      grid.appendChild(leftMidBottom);

      const rightMidBottom = createZoomTile(6, false);
      rightMidBottom.style.gridColumn = "4";
      rightMidBottom.style.gridRow = "3";
      grid.appendChild(rightMidBottom);

      const bottomOrder = [1, 2, 3, 4];
      bottomOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "4";
        grid.appendChild(tile);
      });

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "2 / span 2";
      mainTile.style.gridRow = "1 / span 3";
      grid.appendChild(mainTile);
      return;
    }

    if (code === "12v1") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(4, 1fr)";

      const topOrder = [9, 11, 12, 10];
      topOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "1";
        grid.appendChild(tile);
      });

      const leftCol = [7, 5];
      leftCol.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = "1";
        tile.style.gridRow = String(idx + 2);
        grid.appendChild(tile);
      });

      const rightCol = [8, 6];
      rightCol.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = "4";
        tile.style.gridRow = String(idx + 2);
        grid.appendChild(tile);
      });

      const bottomOrder = [1, 2, 3, 4];
      bottomOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "4";
        grid.appendChild(tile);
      });

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "2 / span 2";
      mainTile.style.gridRow = "2 / span 2";
      grid.appendChild(mainTile);
      return;
    }

    if (code === "13on1") {
      grid.style.gridTemplateColumns = "repeat(5, 1fr)";
      grid.style.gridTemplateRows = "repeat(5, 1fr)";

      const topLeft = createZoomTile(12, false);
      topLeft.style.gridColumn = "1";
      topLeft.style.gridRow = "1";
      grid.appendChild(topLeft);

      const topRight = createZoomTile(13, false);
      topRight.style.gridColumn = "5";
      topRight.style.gridRow = "1";
      grid.appendChild(topRight);

      const leftCol = [10, 8, 6];
      leftCol.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = "1";
        tile.style.gridRow = String(idx + 2);
        grid.appendChild(tile);
      });

      const rightCol = [11, 9, 7];
      rightCol.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = "5";
        tile.style.gridRow = String(idx + 2);
        grid.appendChild(tile);
      });

      const bottomOrder = [1, 2, 3, 4, 5];
      bottomOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "5";
        grid.appendChild(tile);
      });

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "2 / span 3";
      mainTile.style.gridRow = "1 / span 4";
      grid.appendChild(mainTile);
      return;
    }

    if (code === "16v1") {
      grid.style.gridTemplateColumns = "repeat(5, 1fr)";
      grid.style.gridTemplateRows = "repeat(5, 1fr)";

      const topOrder = [12, 14, 15, 16, 13];
      topOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "1";
        grid.appendChild(tile);
      });

      const leftCol = [10, 8, 6];
      leftCol.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = "1";
        tile.style.gridRow = String(idx + 2);
        grid.appendChild(tile);
      });

      const rightCol = [11, 9, 7];
      rightCol.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = "5";
        tile.style.gridRow = String(idx + 2);
        grid.appendChild(tile);
      });

      const bottomOrder = [1, 2, 3, 4, 5];
      bottomOrder.forEach(function (tileIndex, idx) {
        const tile = createZoomTile(tileIndex, false);
        tile.style.gridColumn = String(idx + 1);
        tile.style.gridRow = "5";
        grid.appendChild(tile);
      });

      const mainTile = createZoomTile(0, true);
      mainTile.style.gridColumn = "2 / span 3";
      mainTile.style.gridRow = "2 / span 3";
      grid.appendChild(mainTile);
      return;
    }

    if (code === "2ptop8") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "2fr 1fr 1fr";

      const mainLeft = createZoomTile(0, true);
      mainLeft.style.gridColumn = "1 / span 2";
      mainLeft.style.gridRow = "1";
      grid.appendChild(mainLeft);

      const mainRight = createZoomTile(1, true);
      mainRight.style.gridColumn = "3 / span 2";
      mainRight.style.gridRow = "1";
      grid.appendChild(mainRight);

      for (let i = 2; i <= 9; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(((i - 2) % 4) + 1);
        tile.style.gridRow = String(Math.floor((i - 2) / 4) + 2);
        grid.appendChild(tile);
      }
      return;
    }

    if (code === "2v17") {
      grid.style.gridTemplateColumns = "repeat(5, 1fr)";
      grid.style.gridTemplateRows = "repeat(5, 1fr)";

      const mainLeft = createZoomTile(0, true);
      mainLeft.style.gridColumn = "1 / span 2";
      mainLeft.style.gridRow = "1 / span 2";
      grid.appendChild(mainLeft);

      const mainRight = createZoomTile(1, true);
      mainRight.style.gridColumn = "3 / span 2";
      mainRight.style.gridRow = "1 / span 2";
      grid.appendChild(mainRight);

      const rightTop = createZoomTile(2, false);
      rightTop.style.gridColumn = "5";
      rightTop.style.gridRow = "1";
      grid.appendChild(rightTop);

      const rightMid = createZoomTile(3, false);
      rightMid.style.gridColumn = "5";
      rightMid.style.gridRow = "2";
      grid.appendChild(rightMid);

      for (let i = 4; i <= 18; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(((i - 4) % 5) + 1);
        tile.style.gridRow = String(Math.floor((i - 4) / 5) + 3);
        grid.appendChild(tile);
      }
      return;
    }

    if (code === "2v4v15v4v1") {
      grid.style.gridTemplateColumns = "repeat(8, 1fr)";
      grid.style.gridTemplateRows = "4fr 2fr 1fr 1fr";

      const mainLeft = createZoomTile(0, true);
      mainLeft.style.gridColumn = "1 / span 4";
      mainLeft.style.gridRow = "1";
      grid.appendChild(mainLeft);

      const mainRight = createZoomTile(1, true);
      mainRight.style.gridColumn = "5 / span 4";
      mainRight.style.gridRow = "1";
      grid.appendChild(mainRight);

      const overlay = createZoomTile(25, false);
      overlay.classList.add("zoom-overlay-tile");
      overlay.style.gridColumn = "8";
      overlay.style.gridRow = "1";
      grid.appendChild(overlay);

      for (let i = 2; i <= 5; i += 1) {
        const tile = createZoomTile(i, false);
        const groupIndex = i - 2;
        tile.style.gridColumn = String(groupIndex * 2 + 1) + " / span 2";
        tile.style.gridRow = "2";
        grid.appendChild(tile);
      }

      for (let i = 6; i <= 13; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(i - 5);
        tile.style.gridRow = "3";
        grid.appendChild(tile);
      }

      for (let i = 14; i <= 20; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(i - 13);
        tile.style.gridRow = "4";
        grid.appendChild(tile);
      }

      const microHost = createMicroHost(21);
      microHost.style.gridColumn = "8";
      microHost.style.gridRow = "4";
      grid.appendChild(microHost);
      return;
    }

    if (code === "2p8") {
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gridTemplateRows = "repeat(4, 1fr)";

      const top1 = createZoomTile(6, false);
      top1.style.gridColumn = "1";
      top1.style.gridRow = "1";
      grid.appendChild(top1);

      const top2 = createZoomTile(7, false);
      top2.style.gridColumn = "2";
      top2.style.gridRow = "1";
      grid.appendChild(top2);

      const top3 = createZoomTile(8, false);
      top3.style.gridColumn = "3";
      top3.style.gridRow = "1";
      grid.appendChild(top3);

      const top4 = createZoomTile(9, false);
      top4.style.gridColumn = "4";
      top4.style.gridRow = "1";
      grid.appendChild(top4);

      const mainLeft = createZoomTile(0, true);
      mainLeft.style.gridColumn = "1 / span 2";
      mainLeft.style.gridRow = "2 / span 2";
      grid.appendChild(mainLeft);

      const mainRight = createZoomTile(1, true);
      mainRight.style.gridColumn = "3 / span 2";
      mainRight.style.gridRow = "2 / span 2";
      grid.appendChild(mainRight);

      for (let i = 2; i <= 5; i += 1) {
        const bottomTile = createZoomTile(i, false);
        bottomTile.style.gridColumn = String(i - 1);
        bottomTile.style.gridRow = "4";
        grid.appendChild(bottomTile);
      }
      return;
    }

    const downMatch = code.match(/^1d(\d+)$/i);
    if (downMatch) {
      const downCount = Math.max(1, Number(downMatch[1] || 1));
      grid.style.gridTemplateColumns = "repeat(" + downCount + ", 1fr)";
      grid.style.gridTemplateRows = "5fr 1fr";

      const mainTile = createZoomTile(0, true);
      if (downCount === 9) {
        mainTile.style.gridColumn = "2 / span 7";
      } else {
        mainTile.style.gridColumn = "1 / span " + downCount;
      }
      mainTile.style.gridRow = "1";
      grid.appendChild(mainTile);

      for (let i = 1; i <= downCount; i += 1) {
        const tile = createZoomTile(i, false);
        tile.style.gridColumn = String(i);
        tile.style.gridRow = "2";
        grid.appendChild(tile);
      }
      return;
    }

    const sideTiles = Math.max(total - 1, 0);
    const cols = total <= 6 ? 3 : total <= 12 ? 4 : 5;
    const rows = Math.max(3, Math.ceil(sideTiles / Math.max(cols - 1, 1)) + 1);

    grid.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    grid.style.gridTemplateRows = "repeat(" + rows + ", 1fr)";

    const mainTile = createZoomTile(0, true);
    const mainCols = Math.max(2, cols - 1);
    const mainRows = Math.max(2, Math.min(rows - 1, Math.ceil((rows * 2) / 3)));
    mainTile.style.gridColumn = "1 / span " + mainCols;
    mainTile.style.gridRow = "1 / span " + mainRows;
    grid.appendChild(mainTile);

    for (let i = 1; i < total; i += 1) {
      grid.appendChild(createZoomTile(i, false));
    }
  }

  function initLayoutSelector() {
    const grid = document.querySelector(".zoom-grid");
    const controls = grid ? grid.querySelector(".zoom-controls") : null;
    const thumbs = Array.from(document.querySelectorAll(".layout-thumb"));

    if (!grid || thumbs.length === 0) return;

    function setActiveThumb(activeThumb) {
      thumbs.forEach(function (thumb) {
        thumb.classList.toggle("is-active", thumb === activeThumb);
      });
    }

    function renderFromThumb(thumb) {
      const layoutType =
        thumb.dataset.layoutType ||
        thumb.closest(".layout-group")?.dataset.layoutType ||
        "equal";
      const layoutCode = getLayoutCode(thumb);
      const spec = parseLayoutSpec(layoutType, layoutCode);

      grid.innerHTML = "";
      grid.style.gridTemplateColumns = "";
      grid.style.gridTemplateRows = "";

      if (spec.mode === "focus") {
        renderFocusLayout(grid, spec.total, layoutCode);
      } else {
        renderEqualLayout(grid, spec.total, layoutCode);
      }

      if (controls) {
        grid.appendChild(controls);
      }

      setActiveThumb(thumb);
    }

    thumbs.forEach(function (thumb) {
      thumb.setAttribute("tabindex", "0");
      thumb.setAttribute("role", "button");

      thumb.addEventListener("click", function () {
        renderFromThumb(thumb);
      });

      thumb.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        renderFromThumb(thumb);
      });
    });

    const defaultThumb =
      document.querySelector(
        '.layout-group[data-layout-type="equal"] .layout-thumb',
      ) || thumbs[0];

    if (defaultThumb) {
      renderFromThumb(defaultThumb);
    }
  }

  window.DashboardLayout = {
    initLayoutSelector: initLayoutSelector,
  };
})();
