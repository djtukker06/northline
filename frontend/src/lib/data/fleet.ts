import { makeRng, pick, randInt, clamp, NOW } from "../utils";
import { FACILITIES } from "./network";
import type { Driver, Vehicle, VehicleClass, VehicleStatus } from "./types";

const DRIVER_NAMES = [
  "Thomas Weber",
  "Marieke de Vries",
  "Piotr Kowalczyk",
  "Sofia Almeida",
  "Lars Andersen",
  "Élodie Marchand",
  "Andrés Ibáñez",
  "Giulia Ferrari",
  "Bram Hendriks",
  "Katarzyna Nowak",
  "Jonas Bergström",
  "Nuno Carvalho",
  "Isabelle Dubois",
  "Matthias Brandt",
  "Rocío Delgado",
  "Tomás Ruiz",
  "Anouk Visser",
  "Stefan Müller",
  "Lena Hoffmann",
  "Emil Kowalski",
  "Chiara Rossi",
  "Pedro Santos",
  "Femke Bakker",
  "Karim Belhadj",
  "Ana Popescu",
  "Viktor Novák",
  "Sanne Jansen",
  "Mateusz Wójcik",
  "Camille Rousseau",
  "Hendrik Boersma",
  "Ingrid Solberg",
  "Rafael Moreno",
  "Dominik Fischer",
  "Aurélie Lambert",
  "Joana Teixeira",
  "Wouter Klaassen",
  "Silke Vandenberghe",
  "Marco Bianchi",
  "Agnieszka Zielińska",
  "Björn Lindqvist",
  "Youssef Amrani",
  "Petra Horáková",
  "Nils Eriksen",
  "Clara Fontaine",
  "Sergio Bautista",
  "Daan Mulder",
  "Ewa Lewandowska",
  "Tobias Reinhardt",
  "Lucie Moreau",
  "Filipa Correia",
  "Jasper van Dijk",
  "Milan Dvořák",
  "Astrid Nyman",
  "Óscar Ramírez",
  "Hanne Poulsen",
  "Luca Marchetti",
  "Robert Sikora",
  "Nadine Keller",
  "Eduardo Pinto",
  "Roos Timmermans",
  "Krzysztof Mazur",
  "Amélie Girard",
  "Fabian Schuster",
  "Beatriz Lopes",
  "Sven Haugen",
  "Ilaria Conti",
  "Bartosz Adamczyk",
  "Margot Lefevre",
  "Ruben de Jong",
  "Zuzana Kováčová",
];

const MODELS: Array<{ model: string; cls: VehicleClass; payload: number; base: number }> = [
  { model: "Volvo FH16 500", cls: "tractor", payload: 25.5, base: 29.4 },
  { model: "Scania R450", cls: "tractor", payload: 24.8, base: 27.9 },
  { model: "Mercedes Actros 1851", cls: "tractor", payload: 25.2, base: 28.6 },
  { model: "DAF XF 480", cls: "tractor", payload: 26.1, base: 28.2 },
  { model: "MAN TGX 18.510", cls: "tractor", payload: 25.0, base: 29.1 },
  { model: "Renault T High 520", cls: "tractor", payload: 24.6, base: 30.2 },
  { model: "Iveco S-Way 460", cls: "tractor", payload: 24.2, base: 29.8 },
  { model: "Volvo FM 330 Rigid", cls: "rigid", payload: 11.4, base: 22.1 },
  { model: "MAN TGM 18.290", cls: "rigid", payload: 10.8, base: 21.4 },
  { model: "Scania P280 Reefer", cls: "reefer", payload: 12.6, base: 26.8 },
  { model: "Mercedes Actros Reefer", cls: "reefer", payload: 22.4, base: 32.4 },
  { model: "Mercedes Sprinter 517", cls: "van", payload: 1.4, base: 11.2 },
  { model: "Ford E-Transit 425", cls: "van", payload: 1.1, base: 8.4 },
  { model: "Volvo FM Electric", cls: "electric", payload: 22.0, base: 0 },
  { model: "Scania 25 P BEV", cls: "electric", payload: 18.5, base: 0 },
  { model: "DAF CF Tanker", cls: "tanker", payload: 23.8, base: 31.6 },
];

const ROAD_POSITIONS = [
  "A1 near Osnabrück",
  "A2 near Hannover",
  "E40 near Liège",
  "A4 near Dresden",
  "A7 near Kassel",
  "E19 near Breda",
  "A6 near Beaune",
  "A9 near Nuremberg",
  "E15 near Valence",
  "A2 Poland near Poznań",
  "E70 near Verona",
  "AP-7 near Tarragona",
  "A1 near Bologna",
  "E45 near Aarhus",
  "M20 near Ashford",
  "A8 near Salzburg",
  "D1 near Brno",
  "E5 near Burgos",
  "A16 near Rotterdam",
  "A61 near Koblenz",
  "E411 near Namur",
  "A31 near Metz",
];

/**
 * 184 vehicles: 126 in transit, 21 loading, 28 idle, 9 in maintenance. Interleaved
 * rather than blocked, because fleet numbers are allocated at purchase and have no
 * relationship to what a vehicle happens to be doing today.
 */
const STATUS_PLAN: VehicleStatus[] = (() => {
  const pool: VehicleStatus[] = [
    ...Array<VehicleStatus>(126).fill("in-transit"),
    ...Array<VehicleStatus>(21).fill("loading"),
    ...Array<VehicleStatus>(28).fill("idle"),
    ...Array<VehicleStatus>(9).fill("maintenance"),
  ];
  const rng = makeRng(20_260_818);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
})();

export const FLEET_SIZE = STATUS_PLAN.length;

function initials(name: string) {
  return name
    .split(" ")
    .filter((p) => p[0] === p[0]?.toUpperCase())
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

export const DRIVERS: Driver[] = DRIVER_NAMES.map((name, i) => {
  const rng = makeRng(9001 + i * 37);
  const base = FACILITIES[i % FACILITIES.length];
  const onTime = clamp(89 + rng() * 10.4, 86, 99.4);
  const statusRoll = rng();
  const status: Driver["status"] =
    statusRoll > 0.72
      ? "driving"
      : statusRoll > 0.5
        ? "loading"
        : statusRoll > 0.26
          ? "rest"
          : "off-duty";
  const shiftEnd = new Date(NOW.getTime() + randInt(rng, 40, 460) * 60000);
  return {
    id: `DRV-${String(1040 + i)}`,
    name,
    initials: initials(name),
    base: base.name,
    licence: `${base.countryCode}-C+E`,
    onTimeRate: Number(onTime.toFixed(1)),
    deliveries: randInt(rng, 210, 1840),
    rating: Number((4.1 + rng() * 0.85).toFixed(2)),
    drivingMinutesLeft: status === "driving" ? randInt(rng, 15, 270) : randInt(rng, 240, 540),
    shiftEnds: shiftEnd.toISOString(),
    yearsOfService: randInt(rng, 1, 17),
    status,
  };
});

export const DRIVER_BY_ID = new Map(DRIVERS.map((d) => [d.id, d]));

export const VEHICLES: Vehicle[] = STATUS_PLAN.map((status, i) => {
  const rng = makeRng(4200 + i * 91);
  const spec = MODELS[i % MODELS.length];
  const home = FACILITIES[i % FACILITIES.length];
  const driver = status === "idle" || status === "maintenance" ? null : DRIVERS[i % DRIVERS.length];
  const utilisation =
    status === "in-transit"
      ? 88 + rng() * 11
      : status === "loading"
        ? 70 + rng() * 18
        : status === "idle"
          ? 24 + rng() * 28
          : 0;
  const odometer = randInt(rng, 42_000, 780_000);
  const serviceIn = randInt(rng, -2_400, 28_000);
  const nextService = new Date(NOW.getTime() + randInt(rng, -6, 96) * 86_400_000);
  const health = clamp(
    status === "maintenance" ? 38 + rng() * 22 : 72 + rng() * 27,
    34,
    99,
  );
  const load =
    status === "in-transit"
      ? spec.payload * (0.62 + rng() * 0.36)
      : status === "loading"
        ? spec.payload * (0.15 + rng() * 0.5)
        : 0;

  return {
    id: `NL-TRK-${String(101 + i)}`,
    plate: `${home.countryCode}-${String(10 + (i % 89))}-${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + ((i * 7) % 25))}${randInt(rng, 10, 99)}`,
    model: spec.model,
    vehicleClass: spec.cls,
    status,
    driverId: driver?.id ?? null,
    locationLabel:
      status === "in-transit"
        ? pick(rng, ROAD_POSITIONS)
        : status === "loading"
          ? `${home.name} · dock ${randInt(rng, 1, home.dockDoors)}`
          : status === "maintenance"
            ? `${home.city} workshop`
            : `${home.name} · yard`,
    geo: home.geo,
    region: home.region,
    utilisation: Number(utilisation.toFixed(1)),
    fuelPer100km:
      spec.cls === "electric"
        ? Number((88 + rng() * 26).toFixed(1))
        : Number((spec.base + (rng() - 0.5) * 4.2).toFixed(1)),
    odometer,
    payloadCapacity: spec.payload,
    currentLoad: Number(load.toFixed(1)),
    nextServiceKm: serviceIn,
    nextServiceDate: nextService.toISOString(),
    healthScore: Math.round(health),
    telemetrySpeed: status === "in-transit" ? randInt(rng, 58, 89) : 0,
    homeBase: home.name,
    yearRegistered: randInt(rng, 2018, 2026),
  };
});

/**
 * The vehicle carrying the pinned shipment. Statuses are shuffled across the fleet, so
 * without this the demo's headline load could be shown in transit while its own truck
 * sits idle in a yard.
 */
(function pinFeaturedVehicle() {
  const v = VEHICLES.find((x) => x.id === "NL-TRK-204");
  if (!v) return;

  // Swap statuses with another vehicle rather than overwriting, so the fleet mix
  // stays at 126 / 21 / 28 / 9.
  if (v.status !== "in-transit") {
    const donor = VEHICLES.find((x) => x.status === "in-transit" && x.id !== v.id);
    if (donor) donor.status = v.status;
  }
  v.status = "in-transit";
  v.driverId = DRIVERS[0].id; // Thomas Weber
  v.model = "Volvo FH16 500";
  v.vehicleClass = "tractor";
  v.payloadCapacity = 25.5;
  v.currentLoad = 18.4;
  v.locationLabel = "A2 near Hannover";
  v.telemetrySpeed = 74;
  v.homeBase = "Rotterdam DC";
  v.geo = "rotterdam";
  v.region = "benelux";
  v.healthScore = 91;
})();

export const VEHICLE_BY_ID = new Map(VEHICLES.map((v) => [v.id, v]));

export const FLEET_STATUS_COUNTS = {
  "in-transit": VEHICLES.filter((v) => v.status === "in-transit").length,
  loading: VEHICLES.filter((v) => v.status === "loading").length,
  idle: VEHICLES.filter((v) => v.status === "idle").length,
  maintenance: VEHICLES.filter((v) => v.status === "maintenance").length,
};

/**
 * Share of committed vehicle-hours across the fleet that is actually available to
 * dispatch. Vehicles in the workshop are excluded from the denominator, which is the
 * standard treatment: an asset off the road cannot be under-used.
 */
const AVAILABLE = VEHICLES.filter((v) => v.status !== "maintenance");
const UTILISATION_TARGET = 82.6;

(function calibrateUtilisation() {
  const mean = AVAILABLE.reduce((s, v) => s + v.utilisation, 0) / AVAILABLE.length;
  const shift = UTILISATION_TARGET - mean;
  let running = 0;
  AVAILABLE.forEach((v, i) => {
    if (i === AVAILABLE.length - 1) {
      v.utilisation = Number(
        (UTILISATION_TARGET * AVAILABLE.length - running).toFixed(1),
      );
    } else {
      v.utilisation = Number(clamp(v.utilisation + shift, 4, 99.4).toFixed(1));
      running = Number((running + v.utilisation).toFixed(1));
    }
  });
})();

export const FLEET_UTILISATION = Number(
  (AVAILABLE.reduce((sum, v) => sum + v.utilisation, 0) / AVAILABLE.length).toFixed(1),
);

export const AVAILABLE_VEHICLES = AVAILABLE.length;

export const AVG_FUEL = Number(
  (
    VEHICLES.filter((v) => v.vehicleClass !== "electric").reduce(
      (s, v) => s + v.fuelPer100km,
      0,
    ) / VEHICLES.filter((v) => v.vehicleClass !== "electric").length
  ).toFixed(1),
);

export const AVG_SPEED = Number(
  (
    VEHICLES.filter((v) => v.status === "in-transit").reduce(
      (s, v) => s + v.telemetrySpeed,
      0,
    ) / FLEET_STATUS_COUNTS["in-transit"]
  ).toFixed(1),
);

export const AVG_HEALTH = Number(
  (VEHICLES.reduce((s, v) => s + v.healthScore, 0) / VEHICLES.length).toFixed(1),
);

export const VEHICLE_CLASS_LABEL: Record<VehicleClass, string> = {
  tractor: "Tractor unit",
  rigid: "Rigid 18t",
  reefer: "Refrigerated",
  van: "Van 3.5t",
  tanker: "Tanker",
  electric: "Electric",
};
