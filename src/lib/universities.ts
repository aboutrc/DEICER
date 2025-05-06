export interface University {
  university: string;
  geofence_coordinates: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  };
}

export const universities: University[] = [
  {
    university: "Michigan State University, East Lansing, MI",
    geofence_coordinates: {
      center: { latitude: 42.7290, longitude: -84.4833 },
      radius: 1600
    }
  },
  {
    university: "Rutgers University, New Brunswick, NJ",
    geofence_coordinates: {
      center: { latitude: 40.5234, longitude: -74.4549 },
      radius: 1600
    }
  },
  {
    university: "University of Nebraska-Lincoln, Lincoln, NE",
    geofence_coordinates: {
      center: { latitude: 40.8171, longitude: -96.7005 },
      radius: 1600
    }
  },
  {
    university: "Indiana University Bloomington, Bloomington, IN",
    geofence_coordinates: {
      center: { latitude: 39.1765, longitude: -86.5004 },
      radius: 1600
    }
  },
  {
    university: "University of Massachusetts Amherst, Amherst, MA",
    geofence_coordinates: {
      center: { latitude: 42.3877, longitude: -72.5280 },
      radius: 1600
    }
  },
  {
    university: "Ohio State University, Columbus, OH",
    geofence_coordinates: {
      center: { latitude: 40.0067, longitude: -83.0200 },
      radius: 2400
    }
  },
  {
    university: "University of Michigan, Ann Arbor, MI",
    geofence_coordinates: {
      center: { latitude: 42.2780, longitude: -83.7382 },
      radius: 1600
    }
  },
  {
    university: "University of Washington, Seattle, WA",
    geofence_coordinates: {
      center: { latitude: 47.6550, longitude: -122.3035 },
      radius: 1600
    }
  },
  {
    university: "University of Minnesota, Minneapolis, MN",
    geofence_coordinates: {
      center: { latitude: 44.9740, longitude: -93.2340 },
      radius: 1600
    }
  },
  {
    university: "Penn State University, State College, PA",
    geofence_coordinates: {
      center: { latitude: 40.8134, longitude: -77.8601 },
      radius: 2400
    }
  },
  {
    university: "Northwestern University, Evanston, IL",
    geofence_coordinates: {
      center: { latitude: 42.0558, longitude: -87.6752 },
      radius: 1600
    }
  },
  {
    university: "University of Oregon, Eugene, OR",
    geofence_coordinates: {
      center: { latitude: 44.0461, longitude: -123.0724 },
      radius: 1600
    }
  },
  {
    university: "Cornell University, Ithaca, NY",
    geofence_coordinates: {
      center: { latitude: 42.4530, longitude: -76.4847 },
      radius: 2400
    }
  },
  {
    university: "Stanford University, Stanford, CA",
    geofence_coordinates: {
      center: { latitude: 37.4275, longitude: -122.1697 },
      radius: 2400
    }
  },
  {
    university: "University of Chicago, Chicago, IL",
    geofence_coordinates: {
      center: { latitude: 41.7886, longitude: -87.6009 },
      radius: 1600
    }
  },
  {
    university: "University of New Mexico, Albuquerque, NM",
    geofence_coordinates: {
      center: { latitude: 35.0845, longitude: -106.6294 },
      radius: 1600
    }
  },
  {
    university: "New Mexico State University, Las Cruces, NM",
    geofence_coordinates: {
      center: { latitude: 32.2838, longitude: -106.7475 },
      radius: 2400
    }
  },
  {
    university: "North Carolina State University, Raleigh, NC",
    geofence_coordinates: {
      center: { latitude: 35.7846, longitude: -78.6785 },
      radius: 2400
    }
  },
  {
    university: "Johns Hopkins University, Baltimore, MD",
    geofence_coordinates: {
      center: { latitude: 39.3289, longitude: -76.6205 },
      radius: 1600
    }
  },
  {
    university: "Massachusetts Institute of Technology, Cambridge, MA",
    geofence_coordinates: {
      center: { latitude: 42.3601, longitude: -71.0942 },
      radius: 1200
    }
  },
  {
    university: "Dartmouth College, Hanover, NH",
    geofence_coordinates: {
      center: { latitude: 43.7046, longitude: -72.2866 },
      radius: 1600
    }
  },
  {
    university: "University of Iowa, Iowa City, IA",
    geofence_coordinates: {
      center: { latitude: 41.6611, longitude: -91.5302 },
      radius: 1600
    }
  },
  {
    university: "University of Rochester, Rochester, NY",
    geofence_coordinates: {
      center: { latitude: 43.1343, longitude: -77.6207 },
      radius: 1600
    }
  },
  {
    university: "Rochester Institute of Technology, Rochester, NY",
    geofence_coordinates: {
      center: { latitude: 43.0848, longitude: -77.6745 },
      radius: 2000
    }
  },
  {
    university: "University of Wisconsin-Madison, Madison, WI",
    geofence_coordinates: {
      center: { latitude: 43.0723, longitude: -89.4009 },
      radius: 2400
    }
  },
];