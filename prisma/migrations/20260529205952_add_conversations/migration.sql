-- CreateTable
CREATE TABLE "Reservations" (
    "id" SERIAL NOT NULL,
    "brand" TEXT,
    "resort" TEXT,
    "resort_name" TEXT,
    "booking_date" TEXT,
    "resort_countr_name" TEXT,
    "customer_country" TEXT,
    "reservation_status" TEXT,
    "arrival_date" TEXT,
    "departure_date" TEXT,
    "duree_sejour" INTEGER,
    "nb_booking" INTEGER,
    "adult_par_nuit" INTEGER,
    "kid_par_nuit" INTEGER,
    "rooms_sold" INTEGER,
    "resv_revenue_in_euro" DOUBLE PRECISION,
    "resv_revenue_total_in_euro" DOUBLE PRECISION,

    CONSTRAINT "Reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhelp" (
    "id" SERIAL NOT NULL,
    "nom_projet" TEXT,
    "nom_vdn" TEXT,
    "vdn__id_" DOUBLE PRECISION,
    "zone_geographique" TEXT,
    "nom_activite" TEXT,
    "acw" DOUBLE PRECISION,
    "mea" DOUBLE PRECISION,
    "duree_totale_appel" DOUBLE PRECISION,
    "date_de_debut_et_heure_en_paris_time" TEXT,
    "date_de_fin_et_heure_en_paris_time" TEXT,
    "duree_de_comm" DOUBLE PRECISION,
    "libelle_code_appel" TEXT,
    "ringtime" DOUBLE PRECISION,
    "queuetime" DOUBLE PRECISION,
    "raccroche_agent" DOUBLE PRECISION,
    "code_appel" DOUBLE PRECISION,
    "held" DOUBLE PRECISION,
    "interruptdel" DOUBLE PRECISION,
    "login_agent" DOUBLE PRECISION,
    "numero_compose" DOUBLE PRECISION,

    CONSTRAINT "Webhelp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colt_file" (
    "id" SERIAL NOT NULL,
    "point_dentree" DOUBLE PRECISION,
    "session_dappel" TEXT,
    "appelant" DOUBLE PRECISION,
    "type_dappel" TEXT,
    "numero_cible" DOUBLE PRECISION,
    "svi_seulement" DOUBLE PRECISION,
    "demande_de_mise_en_relation" DOUBLE PRECISION,
    "abandon_dans_lattente" DOUBLE PRECISION,
    "appel_dissuade" DOUBLE PRECISION,
    "resultat" TEXT,
    "code" DOUBLE PRECISION,
    "occupe" DOUBLE PRECISION,
    "non_reponse" DOUBLE PRECISION,
    "identifiant_de_lappel" TEXT,
    "date_colt_file" TEXT,
    "heure_colt_file" TEXT,
    "duree_globale__secondes_" INTEGER,
    "duree_svi__secondes_" INTEGER,
    "duree_dattente__secondes_" INTEGER,
    "duree_de_contact__secondes_" INTEGER,
    "duree_de_mise_en_garde__secondes_" INTEGER,
    "duree_svi_appele_post_contact__secondes_" INTEGER,
    "annee" DOUBLE PRECISION,
    "mois" DOUBLE PRECISION,
    "jour" DOUBLE PRECISION,
    "heure" DOUBLE PRECISION,
    "minute" DOUBLE PRECISION,
    "seconde" DOUBLE PRECISION,

    CONSTRAINT "Colt_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nouvelle conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "question" TEXT,
    "sqlGenerated" TEXT,
    "data" JSONB,
    "response" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_idx" ON "ConversationMessage"("conversationId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
