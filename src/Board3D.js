import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const COLORS = {
  board: 0xcda979,
  boardEdge: 0x99774c,
  line: 0x624b32,
  node: 0x7d6140,
  white: 0xf6e9c9,
  black: 0x302c25,
  selected: 0xd86742,
  hint: 0x89a47d,
};

function makeLine(start, end, color, radius = 0.025) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function clearGroup(group) {
  group.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    }
  });
  group.clear();
}

export default function Board3D({ game, onPointClick, selectedPiece, highlightedTo }) {
  const containerRef = useRef(null);
  const onPointClickRef = useRef(onPointClick);
  const gameRef = useRef(game);
  const selectedPieceRef = useRef(selectedPiece);
  const highlightedToRef = useRef(highlightedTo);
  const rebuildRef = useRef(null);

  useEffect(() => { onPointClickRef.current = onPointClick; }, [onPointClick]);
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { selectedPieceRef.current = selectedPiece; }, [selectedPiece]);
  useEffect(() => { highlightedToRef.current = highlightedTo; }, [highlightedTo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1e8d8);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 9.5, 6.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff8e9, 0x746048, 2.1));
    const keyLight = new THREE.DirectionalLight(0xfff1d5, 3.2);
    keyLight.position.set(-4, 9, 6);
    scene.add(keyLight);

    const boardGroup = new THREE.Group();
    const piecesGroup = new THREE.Group();
    const pointsGroup = new THREE.Group();
    scene.add(boardGroup, piecesGroup, pointsGroup);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let clickablePoints = [];
    let boardSize = '';

    const point = (index, y = 0) => {
      const { rows, cols } = gameRef.current;
      const row = Math.floor(index / cols);
      const col = index % cols;
      return new THREE.Vector3(col - (cols - 1) / 2, y, row - (rows - 1) / 2);
    };

    const updateSize = (render = true) => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 500 ? 42 : 36;
      camera.updateProjectionMatrix();
      const { cols, rows } = gameRef.current;
      const cameraDistance = Math.max(cols * 1.2, rows * 1.55, 7.5);
      camera.position.set(0, cameraDistance, cameraDistance * 0.42);
      camera.lookAt(0, 0, 0);
      if (render) renderer.render(scene, camera);
    };

    const rebuildBoard = () => {
      const { rows, cols, board } = gameRef.current;
      const nextBoardSize = `${rows}x${cols}`;
      if (boardSize !== nextBoardSize) {
        clearGroup(boardGroup);
        boardSize = nextBoardSize;
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(cols + 0.8, 0.32, rows + 0.8),
          new THREE.MeshStandardMaterial({ color: COLORS.board, roughness: 0.72 }),
        );
        plate.position.y = -0.22;
        boardGroup.add(plate);

        const trim = new THREE.Mesh(
          new THREE.BoxGeometry(cols + 0.94, 0.08, rows + 0.94),
          new THREE.MeshStandardMaterial({ color: COLORS.boardEdge, roughness: 0.65 }),
        );
        trim.position.y = -0.38;
        boardGroup.add(trim);

        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const index = row * cols + col;
            if (col < cols - 1) {
              boardGroup.add(makeLine(point(index), point(index + 1), COLORS.line));
            }
            if (row < rows - 1) {
              boardGroup.add(makeLine(point(index), point(index + cols), COLORS.line));
            }
            if (row < rows - 1 && col < cols - 1 && (row + col) % 2 === 0) {
              boardGroup.add(makeLine(point(index), point(index + cols + 1), COLORS.line, 0.02));
            }
            if (row < rows - 1 && col > 0 && (row + col) % 2 === 0) {
              boardGroup.add(makeLine(point(index), point(index + cols - 1), COLORS.line, 0.02));
            }
          }
        }
        updateSize(false);
      }

      clearGroup(piecesGroup);
      clearGroup(pointsGroup);
      clickablePoints = [];

      board.forEach((piece, index) => {
        if (!piece) return;
        const position = point(index, 0.02);
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.34, 0.13, 24),
          new THREE.MeshStandardMaterial({
            color: piece === 1 ? COLORS.white : COLORS.black,
            roughness: piece === 1 ? 0.36 : 0.68,
            metalness: piece === 1 ? 0.08 : 0.03,
          }),
        );
        base.position.copy(position);
        base.position.y += 0.1;
        piecesGroup.add(base);

        const crown = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 20, 12),
          new THREE.MeshStandardMaterial({
            color: piece === 1 ? COLORS.white : COLORS.black,
            roughness: piece === 1 ? 0.38 : 0.62,
          }),
        );
        crown.scale.y = 0.34;
        crown.position.copy(position);
        crown.position.y += 0.2;
        piecesGroup.add(crown);
      });

      for (let index = 0; index < board.length; index += 1) {
        const isSelected = index === selectedPieceRef.current;
        const isHint = highlightedToRef.current.includes(index);
        if (isSelected) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.39, 0.035, 8, 24),
            new THREE.MeshStandardMaterial({ color: COLORS.selected, roughness: 0.55 }),
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.copy(point(index, 0.11));
          pointsGroup.add(ring);
        }
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(isSelected ? 0.16 : isHint ? 0.14 : 0.09, 12, 8),
          new THREE.MeshStandardMaterial({
            color: isSelected ? COLORS.selected : isHint ? COLORS.hint : COLORS.node,
            roughness: 0.55,
            transparent: isHint,
            opacity: isHint ? 0.82 : 1,
          }),
        );
        node.position.copy(point(index, 0.025));
        pointsGroup.add(node);

        const hitTarget = new THREE.Mesh(
          new THREE.SphereGeometry(0.34, 8, 6),
          new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
        );
        hitTarget.position.copy(point(index, 0.2));
        hitTarget.userData.pointIndex = index;
        pointsGroup.add(hitTarget);
        clickablePoints.push(hitTarget);
      }
      renderer.render(scene, camera);
    };
    rebuildRef.current = rebuildBoard;

    const onPointerDown = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(clickablePoints, false)[0];
      if (hit) onPointClickRef.current(hit.object.userData.pointIndex);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize(false);
    rebuildBoard();

    return () => {
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      clearGroup(boardGroup);
      clearGroup(piecesGroup);
      clearGroup(pointsGroup);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      rebuildRef.current = null;
    };
  }, []);

  useEffect(() => {
    rebuildRef.current?.();
  }, [game, selectedPiece, highlightedTo]);

  return <div className="board-canvas" ref={containerRef} aria-label="Plateau de Fanorona en trois dimensions" />;
}
