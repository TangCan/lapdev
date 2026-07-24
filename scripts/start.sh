podman rm -f $(podman ps -aq)
podman run -d --rm --name lapdev -p 3333:3333 -v $(pwd)/workspace:/workspace localhost/lapdev:latest
curl -s http://localhost:3333/health
