(() => {
  'use strict';
  const atom = document.querySelector('.research-atom');
  if (!atom) return;
  const nodes = [...atom.querySelectorAll('[data-atom-node]')];
  const detail = atom.querySelector('.atom-detail');
  const kind = detail.querySelector('.atom-kind');
  const title = detail.querySelector('h3');
  const description = detail.querySelector('.atom-description');
  const destination = detail.querySelector('.atom-destination');
  const areas = {
    core: {
      kind: 'The nucleus · connecting methods',
      title: 'Learning & verification',
      description: 'The thread through my work: learning useful models, preserving physical structure, and checking the evidence behind their predictions.',
      link: '#research', label: 'Explore my research ↗', color: '#d9e9bd'
    },
    networks: {
      kind: 'Current research · quantum information',
      title: 'Entanglement certification',
      description: 'What can a quantum network promise about the pairs it delivers? My work with Prof. Michael Mattarock separates per-user guarantees from average-fidelity certificates.',
      link: '#entanglement-research', label: 'Read the research ↗', color: '#f0ad91'
    },
    chemistry: {
      kind: 'Current research · CMU Chemistry',
      title: 'Learning chemical Hamiltonians',
      description: 'With Prof. David Yaron, I am extending DFTBML to a split-valence basis in PyTorch, enforcing symmetry constraints and checking numerical behavior against quantum-chemistry reference implementations.',
      link: '#chemistry-research', label: 'Explore the chemistry work ↗', color: '#91ddc2'
    },
    algorithms: {
      kind: 'Projects · circuits and optimization',
      title: 'Quantum algorithms',
      description: 'From QAOA portfolio optimization to calibration-aware Dicke-state circuits for Willow, I build and test algorithms against the constraints of physical hardware.',
      link: '#projects', label: 'See the quantum projects ↗', color: '#b7adf0'
    },
    security: {
      kind: 'Master’s thesis · quantum-safe systems',
      title: 'Quantum security',
      description: 'My thesis studies how post-quantum certificates affect enterprise Wi-Fi authentication, using ns-3 to evaluate protocols, network behavior, and a hybrid backbone.',
      link: '#security-research', label: 'Read about the thesis ↗', color: '#e7c589'
    },
    qec: {
      kind: 'Research interest · reliable computation',
      title: 'Quantum error correction',
      description: 'I want to study how learning and inference can help protect quantum information. My notes explore error-correcting codes, noisy hardware, and autonomous correction.',
      link: 'Posts/Post7-autoqec-stanford/index.html', label: 'Read my QEC notes ↗', color: '#91bdec'
    }
  };
  function selectNode(node) {
    const area = areas[node.dataset.atomNode];
    if (!area) return;
    nodes.forEach(item => item.setAttribute('aria-pressed', String(item === node)));
    kind.textContent = area.kind;
    title.textContent = area.title;
    description.textContent = area.description;
    destination.href = area.link;
    destination.textContent = area.label;
    detail.style.setProperty('--selected-color', area.color);
  }
  nodes.forEach(node => {
    node.addEventListener('click', () => selectNode(node));
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectNode(node);
      }
      // Arrow keys move around the atom without forcing pointer interaction.
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        const step = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
        const next = nodes[(nodes.indexOf(node) + step + nodes.length) % nodes.length];
        next.focus();
        selectNode(next);
      }
    });
  });
})();
