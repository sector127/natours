/* eslint-disable*/

export const leaflet = (locations) => {
  const map = L.map('map', {
    zoomControl: false,
    center: locations[0].coordinates,
    zoom: 1,
  });

  const myPin = L.icon({
    iconUrl: '/img/pin.png',
    popupAnchor: [15, 18],
    className: 'marker',
  });

  L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ).addTo(map);

  const points = [];
  locations.forEach((loc) => {
    points.push([loc.coordinates[1], loc.coordinates[0]]);
    L.marker([loc.coordinates[1], loc.coordinates[0]], {
      icon: myPin,
    })
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false,
        closeOnClick: false,
      })
      .openPopup();
  });

  const bounds = L.latLngBounds(points).pad(0.5);
  map.flyToBounds(bounds);

  L.Routing.control({
    waypoints: points,
    lineOptions: {
      styles: [
        { color: 'black', opacity: 0.15, weight: 9 },
        { color: 'white', opacity: 0.8, weight: 5 },
        { color: '#55c57a', opacity: 1, weight: 5 },
      ],
    },
    show: false,
  }).addTo(map);

  map.scrollWheelZoom.disable();
};
