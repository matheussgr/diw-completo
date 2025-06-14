fetch('http://localhost:3000/filmes')
  .then(res => res.json())
  .then(filmes => {
    const categorias = {};

    filmes.forEach(filme => {
      const genero = filme.categoria || filme.genero || "Desconhecido";
      categorias[genero] = (categorias[genero] || 0) + 1;
    });

    const labels = Object.keys(categorias);
    const dados = Object.values(categorias);

    const ctx = document.getElementById('graficoCategorias').getContext('2d');


    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 123, 255, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 123, 255, 0.4)');

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Quantidade de Filmes por Categoria',
          data: dados,
          backgroundColor: gradient,
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Distribuição de Filmes por Categoria',
            color: '#ffffff',
            font: {
              size: 18,
              family: 'Arial',
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 30
            }
          },
          tooltip: {
            backgroundColor: '#333',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#555',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#ffffff'
            },
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff',
              stepSize: 1
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutBounce'
        }
      }
    });
  });
