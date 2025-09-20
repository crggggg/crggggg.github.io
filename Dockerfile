# Stage 1: Specify the base image
# This uses the official, lightweight Nginx web server image.
FROM nginx:alpine

# Stage 2: Copy your website files
# This copies all the files from your project's current directory (.)
# into the default folder Nginx uses to serve websites (/usr/share/nginx/html).
# Make sure your index.html file is in the root of your project.
COPY . /usr/share/nginx/html

# Stage 3: Expose the port
# This informs Docker that the container listens on port 80, the standard HTTP port.
EXPOSE 80

# Stage 4: Define the start command
# This command starts the Nginx server in the foreground when the container runs.
CMD ["nginx", "-g", "daemon off;"]
