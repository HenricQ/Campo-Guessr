function initMap() {
    const streetViewService = new google.maps.StreetViewService();

    // Função para gerar localização aleatória dentro de um círculo
    function getRandomLocationInCircle(centerLat, centerLng, radiusKm) {
        const earthRadius = 6371; // Raio da Terra em km

        // Ângulo aleatório
        const angle = Math.random() * 2 * Math.PI;

        // Distância aleatória no raio do círculo
        const distance = Math.sqrt(Math.random()) * radiusKm;

        // Calcula variação em latitude e longitude
        const deltaLat = distance / earthRadius;
        const deltaLng = distance / (earthRadius * Math.cos((Math.PI * centerLat) / 180));

        // Coordenadas resultantes
        const randomLat = centerLat + deltaLat * Math.sin(angle);
        const randomLng = centerLng + deltaLng * Math.cos(angle);

        return { lat: randomLat, lng: randomLng };
    }

    // Função para encontrar uma localização válida no Street View
    function findValidStreetViewLocation(callback) {
        const location = getRandomLocationInCircle(-20.467, -54.623, 800); // Raio de 14 km

        streetViewService.getPanorama(
            { location: location, radius: 50 }, // Busca uma visão a até 50m
            (data, status) => {
                if (status === google.maps.StreetViewStatus.OK) {
                    callback(location); // Retorna localização válida
                } else {
                    console.log("Tentando outra coordenada...");
                    findValidStreetViewLocation(callback); // Tenta novamente
                }
            }
        );
    }

    // Busca uma localização válida e inicializa o Street View
    findValidStreetViewLocation((streetViewLocation) => {
        console.log("Coordenada do Street View encontrada:", streetViewLocation);

        // Inicializa o Street View
        const streetView = new google.maps.StreetViewPanorama(
            document.getElementById("street-view"),
            {
                position: streetViewLocation,
                pov: { heading: 0, pitch: 0 },
                zoom: -1,
                disableDefaultUI: true,
                showRoadLabels: false,
                addressControl: false,
                fullscreenControl: false,
                linksControl: false,
            }
        );

        // Evento para voltar à posição inicial
        document.getElementById('voltarHome').addEventListener('click', () => {
            streetView.setPosition(streetViewLocation);
            console.log("Voltou à posição inicial:", streetViewLocation);
      });

      // Inicializa o mini mapa com um centro fixo ou aleatório
      const miniMapCenter = { lat: -20.467, lng: -54.623 }; // Centro fixo
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: miniMapCenter, // Usa um centro fixo (não usa a localização atual)
        streetViewControl: false, // Desabilita o controle de Street View
        zoomControl: false, // Desabilita o controle de zoom (remover botão de zoom)
        mapTypeId: google.maps.MapTypeId.ROADMAP, // Define o tipo de mapa como o padrão
        mapTypeControl: false, // Desabilita a opção de alternar para o satélite
        fullscreenControl: false, // Desabilita o controle de tela cheia
        gestureHandling: 'greedy', // Remove gestos de rotação e arraste de mapa
        clickableIcons: false,
        styles: [ // Remove pontos de interesse (POIs)
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [
              {
                visibility: "off" // Esconde os POIs (pontos de interesse)
              }
            ]
          }
        ]
      });

      // Variável para armazenar o marcador
      let currentMarker = null;

      // Variável para armazenar a localização do marcador
      let markerLocation = null;

      // Evento de clique no mini mapa para adicionar marcador
      google.maps.event.addListener(map, 'click', function(event) {
        if (document.getElementById('map').style.height === '60vh') {
          // Se o mini mapa estiver cobrindo a tela, não permite adicionar novos marcadores
          return;
        }

        const clickedLocation = event.latLng;

        // Se já houver um marcador, remova-o
        if (currentMarker) {
          currentMarker.setMap(null); // Remove o marcador antigo
        }

        // Adiciona um novo marcador no local do clique
        currentMarker = new google.maps.Marker({
          position: clickedLocation,
          map: map,
          title: 'Novo Marcador',
          icon:{
            url: 'assets/redPill.png',
            scaledSize: new google.maps.Size(48, 48)
        } 
        });

        // Armazena a localização do marcador
        markerLocation = clickedLocation;

        // Exibe o botão de confirmação
        document.getElementById('confirm-button').style.display = 'block';
      });

      // Função para calcular a distância Haversine entre dois pontos
      function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em quilômetros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distância em quilômetros
        

        const line = new google.maps.Polyline({
            path: [markerLocation, streetViewLocation], // Define os pontos de início e fim
            geodesic: true, // Utiliza uma linha geodésica
            strokeColor: "#000000", // Cor da linha (vermelho)
            strokeOpacity: 0.6, // Opacidade da linha
            strokeWeight: 4, // Espessura da linha
          });

        line.setMap(map)
          
        return distance;

      }

      // Ação do botão de confirmação
      document.getElementById('confirm-button').addEventListener('click', function() {
        if (markerLocation) {
          const markerLat = markerLocation.lat();
          const markerLng = markerLocation.lng();

          // Calcula a distância entre o marcador e a localização do Street View
          const distance = haversineDistance(markerLat, markerLng, streetViewLocation.lat, streetViewLocation.lng);
          console.log("Distância entre o marcador e o Street View:", distance.toFixed(2), "km");

          // Exibe a distância no card
          document.getElementById('distance-result').innerText = "Distância entre os pontos: " + distance.toFixed(2) + " km";

          // Exibe o card de resultado
          document.getElementById('telaFinal').style.display = 'block';

          // Expande o mini mapa para cobrir toda a tela
          document.getElementById('map').style = 'height: 60vh; width:100vw;top:0';

          // Oculta o botão de confirmação após a escolha
          document.getElementById('confirm-button').style.display = 'none';
          document.getElementById('voltarHome').style.display = 'none';
          streetView.setVisible(false)

          // Adiciona os dois marcadores no mapa principal
          new google.maps.Marker({
            position: streetViewLocation,
            map: map,
            title: 'Street View',
            icon:{
                url: 'assets/bluePill.png',
                scaledSize: new google.maps.Size(48, 48)
            }    
          });

          currentMarker.setTitle('Chute')
          

        } else {
          alert("Por favor, adicione um marcador primeiro.");
        }
      });

      // Vincula o Street View ao mapa principal
      map.setStreetView(streetView);
    });
  }

  // Inicializa o mapa e o Street View ao carregar a página
  window.onload = initMap;