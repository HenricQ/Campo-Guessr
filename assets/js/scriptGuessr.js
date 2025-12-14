function initMap() {
  const streetViewService = new google.maps.StreetViewService();

  const polygonPoints = [
    { lat: -20.565132, lng: -54.680576 },
    { lat: -20.552136, lng: -54.675661 },
    { lat: -20.537692, lng: -54.703675 },
    { lat: -20.483368, lng: -54.770073 },
    { lat: -20.473987, lng: -54.770376 },
    { lat: -20.470992, lng: -54.734816 },
    { lat: -20.452666, lng: -54.713872 },
    { lat: -20.428064, lng: -54.671712 },
    { lat: -20.416919, lng: -54.678062 },
    { lat: -20.406422, lng: -54.646621 },
    { lat: -20.390414, lng: -54.627415 },
    { lat: -20.384819, lng: -54.588008 },
    { lat: -20.370298, lng: -54.569131 },
    { lat: -20.377116, lng: -54.536187 },
    { lat: -20.403504, lng: -54.507935 },
    { lat: -20.445297, lng: -54.503092 },
    { lat: -20.448021, lng: -54.513981 },
    { lat: -20.469029, lng: -54.517478 },
    { lat: -20.491103, lng: -54.550681 },
    { lat: -20.503948, lng: -54.554511 },
    { lat: -20.523706, lng: -54.565926 },
    { lat: -20.538777, lng: -54.572912 },
    { lat: -20.558521, lng: -54.563647 },
    { lat: -20.570928, lng: -54.572135 },
  ];

  const flatPolygon = polygonPoints.flatMap(p => [p.lat, p.lng]);
  const triangulation = earcut(flatPolygon);

  function triangleArea(a, b, c) {
    return Math.abs(
      (a.lat * (b.lng - c.lng) +
      b.lat * (c.lng - a.lng) +
      c.lat * (a.lng - b.lng)) / 2
    );
  }

// prepara triângulos ponderados
const triangles = (() => {
  const list = [];
  let total = 0;

  for (let i = 0; i < triangulation.length; i += 3) {
    const A = getPoint(triangulation[i]);
    const B = getPoint(triangulation[i + 1]);
    const C = getPoint(triangulation[i + 2]);
    const area = triangleArea(A, B, C);
    total += area;
    list.push({ A, B, C, area });
  }

  list.totalArea = total;
  return list;
})();

function getPoint(i) {
  return {
    lat: flatPolygon[i * 2],
    lng: flatPolygon[i * 2 + 1]
  };
}

// 🔥 sorteio REAL dentro do polígono
function randomPointInPolygon() {
  let r = Math.random() * triangles.totalArea;
  let t;
  
  for (const tri of triangles) {
    r -= tri.area;
    if (r <= 0) {
      t = tri;
      break;
    }
  }
  
  // quero buscar entender o funcionamento desta função
  let r1 = Math.random();
  let r2 = Math.random();
  if (r1 + r2 > 1) {
    r1 = 1 - r1;
    r2 = 1 - r2;
  }

  return {
    lat: t.A.lat + r1 * (t.B.lat - t.A.lat) + r2 * (t.C.lat - t.A.lat),
    lng: t.A.lng + r1 * (t.B.lng - t.A.lng) + r2 * (t.C.lng - t.A.lng)
  };
}


  function findValidStreetViewLocation(callback) {
      const location = randomPointInPolygon();
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
          url: '../assets/images/redPill.png',
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

    // let time = 61
    // setInterval(()=>{
    //   document.getElementById('timer').innerHTML = time
    //   time -= 1
    // },1000)

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
              url: '../assets/images/bluePill.png',
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
