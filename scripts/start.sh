echo "1-3) Stopping ......"
podman rm -f $(podman ps -aq)
sleep 1
echo "2-3) Starting ......"
podman run -d --rm --name lapdev -p 3333:3333 -v $(pwd)/workspace:/workspace localhost/lapdev:latest
sleep 3
echo "3-3) Testing ......"
curl -s http://localhost:3333/health
