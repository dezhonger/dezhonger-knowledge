# Incremental release: inherit the currently deployed content image so that
# unrelated subject sites do not need to be regenerated for a blog UI change.
# Pin KNOWLEDGE_BASE to a rollback tag of the running image before building.
ARG KNOWLEDGE_BASE=dezhonger-knowledge-knowledge:latest
FROM ${KNOWLEDGE_BASE}
COPY sites/zmq/ /usr/share/nginx/html/zmq/
