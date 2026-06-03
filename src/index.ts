// Start by installing the project with `npm install`
// Set your connection string in the `.env` file
// Set up your schema.prisma file
// Generate the client with `npx prisma generate`
// Update the database with with `npx prisma migrate dev`
// Run the app with `npm run start`

import { input, select } from "@inquirer/prompts";
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
if (!connectionString) {
  throw new Error('Could not find "DATABASE_URL" in your .env file');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// -----------------------------------------------------------------------

async function addMovie(): Promise<void> {
  // Expected:
  // 1. Prompt the user for movie title, year.
  const movieTitle: string = await input({
    message: "Movie title: ",
    required: true,   
  });

  const movieYear: number = Number( await input({
    message: "Release year: ",
    validate: (yearStr) => {
      let yearNum = Number(yearStr);
      if (Number.isNaN(yearNum)) {
        return "Not a valid year";
      }
      
      return true;
    },
    required: true,   
  }));
  
  // 2. Use Prisma client to create a new movie with the provided details.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create
  const newMovie = await prisma.movie.create({
    data: {
      title: movieTitle,
      year: movieYear
    }
  })
  
  // 3. Print the created movie details.
  console.log(`\nAdded ${movieTitle} (${movieYear}) to the database.`);

  // Transactions and relationships (This we can add later on)
  //    Reference : https://www.prisma.io/docs/orm/prisma-client/queries/transactions
  // Expected:
  let done: boolean = false;
  do {

  // 1.b Prompt the user for genre.
    const genreTitle: string = await input({
      message: "Genre: ",
    required: true,   
    });

  // 2.b If the genre does not exist, create a new genre.
  await prisma.movie.update({
    where: {
      id: newMovie.id
    },
    data: {
      genres: {
        connectOrCreate: {
          where: { title: genreTitle },
          create: {title: genreTitle}
        }
      }
    }

  });

  // 3.b Ask the user if they want to want to add another genre to the movie.
  const answer = await input({
    message: "Do you want to add another genre to the movie? (y/n)",
    validate: (answer) => {
      if(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'n') return true;
      else return "Please answer y or n";
    }
  })

  if(answer.toLowerCase() === 'n') done = true;

  } while(!done);
}
// -----------------------------------------------------------------------

async function updateMovie(): Promise<void> {
  // Expected:
  // 1. Prompt the user for movie ID to update.
  const movieId: number = Number(await input({
    message: "Id of movie to update: ",
    validate: (idStr) => {
      if(Number.isNaN(idStr)) return "Please enter a number!";
      else return true;
    },
    required: true
  }))

  if(await prisma.movie.findUnique({ where: { id: movieId } })) {
  // 2. Prompt the user for new movie title, year.
    const movieTitle: string = await input({
      message: "Movie title: ",
      required: true,   
    });

    const movieYear: number = Number( await input({
      message: "Release year: ",
      validate: (yearStr) => {
        let yearNum = Number(yearStr);
        if (Number.isNaN(yearNum)) {
          return "Not a valid year";
        }
        
        return true;
      },
      required: true,   
    }));


  // 3. Use Prisma client to update the movie with the provided ID with the new details.
  //     Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update
    const movie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        title: movieTitle,
        year: movieYear
      }
    })
  
  // 4. Print the updated movie details.
    console.log(`\nUpdated: ${movieTitle} (${movieYear}) in the database.`);
  } else {
      console.log(`Could not find any movie with an id of ${movieId}`);
  };
}

// -----------------------------------------------------------------------

async function deleteMovie(): Promise<void> {
  // Expected:
  // 1. Prompt the user for movie ID to delete.
    const movieId: number = Number(await input({
    message: "Id of movie to delete: ",
    validate: (idStr) => {
      if(Number.isNaN(idStr)) return "Please enter a number!";
      else return true;
    },
    required: true
  }))

  if(await prisma.movie.findUnique({ where: { id: movieId } })) {
  // 2. Use Prisma client to delete the movie with the provided ID.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#delete
    const deletedMovie = await prisma.movie.delete({
      where: {
        id: movieId
      }
    });
  
  // 3. Print a message confirming the movie deletion.
    console.log(`\nDeleted: ${deletedMovie.title} (${deletedMovie.year}) to the database.`);
  }
  else {
    console.log(`Could not find any movie with an id of ${movieId}`);
  }
}

// -----------------------------------------------------------------------

async function listMovies(): Promise<void> {
  // Expected:
  // 1. Use Prisma client to fetch all movies.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
  // 2. Include the genre details in the fetched movies.
  // 3. Print the list of movies with their genres (take 10).
  const movies = await prisma.movie.findMany({
    include: {
      genres: true
    },
    take: 10
  })
  
  let genresStr = '';
  for(const movie of movies) {
    for(const genre of movie.genres) {
      genresStr += `${genre.title} `;
    }
   
    console.log(`Id:${movie.id}  Title: ${movie.title} (${movie.year})  Genres: ${genresStr}`)
     genresStr = '';
  }
}

// -----------------------------------------------------------------------

async function listMovieById(): Promise<void> {
  // Expected:
  // 1. Prompt the user for movie ID to list.
  const movieId: number = Number(await input({
    message: "Id of movie to find: ",
    validate: (idStr) => {
      if(Number.isNaN(idStr)) return "Please enter a number!";
      else return true;
    },
    required: true
  }))

  // 2. Use Prisma client to fetch the movie with the provided ID.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
  // 3. Include the genre details in the fetched movie.
  const movie = await prisma.movie.findUnique({ 
      where: { id: movieId },
      include: { genres: true }
  });

  // 4. Print the movie details with its genre.
  if(movie) {
    let genresStr = '';
    for(const genre of movie.genres) {
      genresStr += `${genre.title} `;
    }
   
    console.log(`Id:${movie.id}  Title: ${movie.title} (${movie.year})  Genres: ${genresStr}`)
  } else {
    console.log(`Could not find any movie with an id of ${movieId}`);
  }
}

// -----------------------------------------------------------------------

async function listMovieByGenre(): Promise<void> {
  // Expected:
  // 1. Prompt the user for genre Name to list movies.
  const genreName: string = await input({message: "Genre: ", required: true});

  // 2. Use Prisma client to fetch movies with the provided genre ID.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
  // 3. Include the genre details in the fetched movies.
  // 4. Print the list of movies with the provided genre (take 10).
  const genre = await prisma.genre.findUnique({
    where: { 
      title: genreName 
    },
    include: {
      movies: {
        take: 10,
        include: {
          genres: true
        }
      },
  }});

  if(genre) {
    let genresStr = '';
    for(const movie of genre.movies) {
      for(const genre of movie.genres) {
        genresStr += `${genre.title} `;
      }
   
    console.log(`Id:${movie.id}  Title: ${movie.title} (${movie.year})  Genres: ${genresStr}`)
     genresStr = '';
  }
  } else {
    console.log(`Could not find the genre ${genreName}`)
  }
}

// -----------------------------------------------------------------------

async function addGenre(): Promise<void> {
  // Expected:
  // 1. Prompt the user for genre name.
  const genreName = await input({message: "Genre to add: ", required: true});

  // 2. Use Prisma client to create a new genre with the provided name.
  //    Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create
  const genreAdded = await prisma.genre.upsert({
    where: { title: genreName },
    update: {},
    create: { title: genreName }
  });

  // 3. Print the created genre details.
  console.log(`Genre added: ${genreAdded.title}`);
}

// -----------------------------------------------------------------------

async function exitProgram(): Promise<never> {
  await prisma.$disconnect();
  process.exit(0);
}

const choices = [
  { name: "Add movie", value: addMovie },
  { name: "Update movie", value: updateMovie },
  { name: "Delete movie", value: deleteMovie },
  { name: "List all movies", value: listMovies },
  { name: "Get movie by ID", value: listMovieById },
  { name: "Get movies by Genre", value: listMovieByGenre },
  { name: "Add genre", value: addGenre },
  { name: "Exit", value: exitProgram },
] as const;

while (true) {
  try {
    console.clear();

    const action = await select({
      message: "Select an action:",
      choices: choices,
      loop: false,
    });

    await action();
  } catch (error) {
    console.error("An error occurred:", error);
    console.log("Please try again.");
  } finally {
    console.log();
    void (await input({
      message: "Press Enter to continue...",
      theme: {
        prefix: "",
      },
    }));
  }
}
