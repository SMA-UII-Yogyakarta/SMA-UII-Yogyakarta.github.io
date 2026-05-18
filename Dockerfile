# Dockerfile (root) — kanonikal ada di deploy/docker/Dockerfile
# 
# WHY: Semua deployment artifact sudah dipindah ke deploy/
# Gunakan ini untuk build:
#   docker build -f deploy/docker/Dockerfile -t smauii-lab:latest .
#
# Lihat deploy/docker/Dockerfile untuk multi-stage build production.
# Lihat deploy/docs/CI_CD.md untuk panduan CI/CD.

FROM scratch
COPY deploy/docker/Dockerfile /Dockerfile
CMD ["echo", "Gunakan: docker build -f deploy/docker/Dockerfile -t smauii-lab:latest ."]
