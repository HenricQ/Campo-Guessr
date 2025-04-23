function initMap() {
    const streetViewService = new google.maps.StreetViewService();


    function getRandomLocationInCircle(centerLat, centerLng, radiusKm) {
        const earthRadius = 6371;
        const angle = Math.random() * 2 * Math.PI;
  

        const distance = Math.sqrt(Math.random()) * radiusKm;
        const deltaLat = distance / earthRadius;
        const deltaLng = distance / (earthRadius * Math.cos((Math.PI * centerLat) / 180));

        const randomLat = centerLat + deltaLat * Math.sin(angle);
        const randomLng = centerLng + deltaLng * Math.cos(angle);

        return { lat: randomLat, lng: randomLng };
    }


    function findValidStreetViewLocation(callback) {
        const location = getRandomLocationInCircle(-20.467, -54.623, 800);
        streetViewService.getPanorama(
            { location: location, radius: 10 }, // Busca uma visão a até 50m
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

    findValidStreetViewLocation((streetViewLocation) => {
        // console.log("Coordenada do Street View encontrada:", streetViewLocation);

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
                linksControl: true,
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
        center: miniMapCenter,
        streetViewControl: false,
        zoomControl: false,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControl: true,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        clickableIcons: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [
              {
                visibility: "off"
              }
            ]
          }
        ]
      });

      let currentMarker = null;
      let markerLocation = null;

      google.maps.event.addListener(map, 'click', function(event) {
        if (document.getElementById('map').style.height === '60vh') {
          return;
        }

        const clickedLocation = event.latLng;

        if (currentMarker) {
          currentMarker.setMap(null);
        }

        currentMarker = new google.maps.Marker({
          position: clickedLocation,
          map: map,
          title: 'Novo Marcador',
          icon:{
            url: 'https://henricq.github.io/Campo-Guessr/assets/images/redPill.png',
            scaledSize: new google.maps.Size(48, 48)
        } 
        });

        markerLocation = clickedLocation;

        // Exibe o botão de confirmação
        document.getElementById('confirm-button').style.display = 'block';
      });

      // Função para calcular a distância Haversine entre dois pontos
      function calcularDistanciaDosPontos(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em quilômetros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distância em quilômetros
        

        const line = new google.maps.Polyline({
            path: [markerLocation, streetViewLocation],
            geodesic: true,
            strokeColor: "#000000",
            strokeOpacity: 0.6,
            strokeWeight: 4,
          });

        line.setMap(map)
        return distance
      }

      function calcularPontuacao(km) {
        if (km >= 12){
          return 0
        } else if (km >= 0.08){
          return (100 - km*100 / 12)
        } else {
          return 100
        }
      }

      let time = 61
      setInterval(()=>{
        document.getElementById('timer').innerHTML = time
        time -= 1
      },1000)

      document.getElementById('confirm-button').addEventListener('click', function() {
        if (markerLocation) {
          const markerLat = markerLocation.lat();
          const markerLng = markerLocation.lng();

          const distance = calcularDistanciaDosPontos(markerLat, markerLng, streetViewLocation.lat, streetViewLocation.lng);
          console.log("Distância entre o marcador e o Street View:", distance.toFixed(2), "km");
          let pontos = calcularPontuacao(distance)
          console.log(pontos)
          document.querySelector('.barra').style = `background: linear-gradient(90deg, #1dc304 ${pontos}%, #f1f7e9 ${pontos}%)`
          document.getElementById('pintos').innerHTML = (pontos*5000/100).toFixed(0) + ' pontos '

          if(distance >= 1){
            document.getElementById('distance-result').innerText = "Distância entre os pontos: " + distance.toFixed(2) + " km";
          } else {
            document.getElementById('distance-result').innerText = "Distância entre os pontos: " + (distance*1000).toFixed(0) + " m";
          }

          document.getElementById('telaFinal').style.display = 'flex';

          document.getElementById('map').style = 'height: 60vh; width:100vw;top:0';
          document.getElementById('logo').style = 'bottom: 12px; left: 12px; width: 128px'

          document.getElementById('confirm-button').style.display = 'none';
          document.getElementById('voltarHome').style.display = 'none';
          streetView.setVisible(false)

          new google.maps.Marker({
            position: streetViewLocation,
            map: map,
            title: 'Street View',
            icon:{
                url: 'https://henricq.github.io/Campo-Guessr/assets/images/bluePill.png',
                scaledSize: new google.maps.Size(48, 48)
            }    
          });

          currentMarker.setTitle('Chute')

        } else {
          alert("Por favor, adicione um marcador primeiro.");
        }
      });

      document.getElementById('next').addEventListener('click', ()=>{
        window.location.reload()
      })

      map.setStreetView(streetView);
    });
  }
  window.onload = initMap;
