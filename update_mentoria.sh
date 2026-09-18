#!/bin/bash

# Carrega variáveis de ambiente do arquivo .env se existir
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SUPABASE_URL="https://bxfzlxqgzcdvjkrbzfkh.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZnpsehFnemNkdmprcmJ6ZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0NjUzODAsImV4cCI6MjA0MjA0MTM4MH0.Ou_93_f8-lJmJbPqZdLXy4KF-7pC16N-UYg7dz_qN4c"

# Atualiza todos os leads convertidos que não são Gisele
curl -X PATCH \
  "${SUPABASE_URL}/rest/v1/leads?status=eq.convertido&nome=neq.Gisele" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"tipo_mentoria":"Mentoria Titulares"}'

echo "Atualização concluída!"
