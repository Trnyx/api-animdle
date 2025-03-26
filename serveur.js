//variable environnement
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

//serveur express
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

//base de donnée
const { MongoClient, ServerApiVersion } = require('mongodb');
const { get } = require('mongoose');

const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function getAnimes() {
  try {
    await client.connect();
    const db = client.db("AnimedleBDD");
    const collection = db.collection("vue_anime");
    const result = await collection.find({}).project({
      "anime.name": 1,
      "anime.slug": 1,
      "anime.resources.external_id":1,
      "anime.animethemes.animethemeentries.videos.link":1
    }).toArray();
    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des animes:', error);
  } finally {
    await client.close();
  }
}

async function getAnimeData(animeSlug) {
  try {
    // Se connecter à MongoDB
    await client.connect();

    // Accéder à la base de données et à la collection 'vue_anime_nom'
    const db = client.db("AnimedleBDD");  // Remplacez par le nom de ta base de données
    const collection = db.collection("vue_anime");  // Le nom de la collection

    // Requête simplifiée pour récupérer un anime par son slug
    const result = await collection.find({
      "anime.slug": animeSlug
    }).toArray();

    // Ajouter un log pour vérifier les résultats
    console.log("Résultats de la requête:", result);  // Affiche les résultats pour vérifier ce que tu récupères

    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération de anime:', error);
    throw error;  // Nous lançons l'erreur pour qu'elle soit capturée dans le bloc catch du serveur
  } finally {
    await client.close();
  }
}



app.get('/anime/:name', async (req, res) => {
  try {
    const animeSlug = req.params.name; 
    const data = await getAnimeData(animeSlug); // Appeler la fonction pour récupérer les données
    if (data.length === 0) {
      res.status(404).json({ message: 'Anime non trouvé' }); // Si aucun résultat, renvoyer une erreur 404
    } else {
      res.json(data); // Renvoyer les données JSON de l'anime trouvé
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});

app.get('/animes', async (req, res) => {
  try {
    const data = await getAnimes(); // Appeler la fonction pour récupérer les données
    res.json(data); // Renvoyer les données JSON de tous les animes
  } catch (error) {
    res.status(500).json({ error: 'Erreur du serveur' });
  }
}
);

var query_ani = `query ($id: Int) {
  Media(id: $id, type: ANIME) {
      title {
          english
      }
      episodes
      genres
      averageScore
      status
      season
      seasonYear
      coverImage {
          extraLarge
          large
          medium
      }
      studios {
          nodes {
              name
          }
      }
  }
} `;

var variables = {
  id: 0
};




app.get('/anilist/:id', async (req, res) => {
  try {
    const id = req.params.id;
    variables.id = id;

    var url_anilist = 'https://graphql.anilist.co',
    options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: query_ani,
            variables: variables
        })
    };
    
    const response = await fetch(url_anilist, options);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur du serveur' });
  }
}
);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}
);
