import Spotify from "spotify-web-api-node";
import Airtable from "airtable";

const spotify = new Spotify({
  clientId: "",
  clientSecret: "",
});

Airtable.configure({
  apiKey: "",
});

const base = Airtable.base("appIooxWrGor2UQ0O");
const albumsTable = base.table("Albums");
const songsTable = base.table("Songs");

await spotify.clientCredentialsGrant().then(
  (data) => {
    console.log(
      `Acquired Spotify access token, expiring in ${data.body.expires_in} seconds.`,
    );

    spotify.setAccessToken(data.body.access_token);
  },
  (err) => {
    console.log("Something went wrong when retrieving an access token", err);
  },
);

const albumsRes = await spotify.getArtistAlbums("7hEZd0gUXJxxXGgMsIPmvG");
const albums = albumsRes.body.items;

const albumTracksPromises = albums.map((album) =>
  spotify.getAlbumTracks(album.id),
);
const albumTracks = await Promise.allSettled(albumTracksPromises);

const linksPromises = await albums.map((album) =>
  fetch(
    `https://api.song.link/v1-alpha.1/links?platform=spotify&type=album&id=${album.id}`,
  ).then((r) => r.json()),
);
const links = await Promise.allSettled(linksPromises);

const albumIds = [];

for (let i = 0; i < albums.length; i++) {
  const album = albums[i];
  const albumLinks = links[i];

  if (albumLinks.status === "fulfilled") {
    const recs = await albumsTable
      .select({
        filterByFormula: `{Name} = "${album.name}"`,
      })
      .all();

    let rec = recs[0];

    if (!rec) {
      rec = await albumsTable.create({
        Name: album.name,
        "Release Year": Number(album.release_date.split("-")[0]),
        Spotify: albumLinks.value.linksByPlatform.spotify?.url,
        "Apple Music": albumLinks.value.linksByPlatform.appleMusic?.url,
        "YouTube Music": albumLinks.value.linksByPlatform.youtubeMusic?.url,
      });
    }

    albumIds.push(rec.id);
  }
}

for (let i = 0; i < albumTracks.length; i++) {
  const album = albumTracks[i];
  const albumId = albumIds[i];

  if (album.status === "fulfilled") {
    for (const track of album.value.body.items) {
      const recs = await songsTable
        .select({
          filterByFormula: `{Name} = "${track.name}"`,
        })
        .all();
      let rec = recs[0];

      if (!rec) {
        const links = await fetch(
          `https://api.song.link/v1-alpha.1/links?songIfSingle=true&platform=spotify&type=song&id=${track.id}`,
        ).then((r) => r.json());

        rec = await songsTable.create({
          Album: [albumId],
          Name: track.name,
          "Track Number": track.track_number,
          Duration: track.duration_ms / 1000,
          Spotify: links.linksByPlatform.spotify?.url,
          "Apple Music": links.linksByPlatform.appleMusic?.url,
          "YouTube Music": links.linksByPlatform.youtubeMusic?.url,
        });

        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
    }
  }
}
